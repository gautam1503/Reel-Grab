import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';

const execFileAsync = promisify(execFile);

const METADATA_TTL_MS = 10 * 60 * 1000;
const PLATFORM_NAMES = { instagram: 'Instagram', youtube: 'YouTube' };

const DEMO_SOURCE_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';
const DEMO_THUMBNAIL = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80';

let runtimePromise = null;
const metadataCache = new Map(); // cleanUrl -> { expires, promise }

/**
 * Locates a working yt-dlp invocation (standalone binary or Python module)
 * and probes optional features once; the result is cached for the process lifetime.
 */
export function getYtdlpRuntime() {
  if (!runtimePromise) runtimePromise = detectRuntime();
  return runtimePromise;
}

async function detectRuntime() {
  const candidates = [];
  if (process.env.YTDLP_PATH) candidates.push({ cmd: process.env.YTDLP_PATH, baseArgs: [] });
  candidates.push({ cmd: 'yt-dlp', baseArgs: [] });
  for (const py of ['python3', 'python', 'py']) {
    candidates.push({ cmd: py, baseArgs: ['-m', 'yt_dlp'] });
  }

  for (const candidate of candidates) {
    try {
      const { stdout } = await execFileAsync(candidate.cmd, [...candidate.baseArgs, '--version'], {
        timeout: 20000,
        windowsHide: true
      });
      const version = stdout.trim();
      // Windows' "python" Store alias and other impostors don't print a yt-dlp date version
      if (!/^\d{4}\.\d{2}\.\d{2}/.test(version)) continue;

      const { stdout: help } = await execFileAsync(candidate.cmd, [...candidate.baseArgs, '--help'], {
        timeout: 20000,
        maxBuffer: 5 * 1024 * 1024,
        windowsHide: true
      });

      return {
        ...candidate,
        version,
        supportsJsRuntimes: help.includes('--js-runtimes'),
        hasFfmpeg: await detectFfmpeg()
      };
    } catch {
      // try the next candidate
    }
  }
  return null;
}

async function detectFfmpeg() {
  try {
    await execFileAsync(process.env.FFMPEG_PATH || 'ffmpeg', ['-version'], { timeout: 10000, windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Arguments shared by every yt-dlp invocation (proxy, cookies, JS runtime for YouTube).
 */
export function buildCommonArgs(runtime) {
  const args = [...runtime.baseArgs, '--ignore-config', '--no-warnings', '--no-playlist'];

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) args.push('--proxy', proxyUrl);

  const cookiesFile = getWritableCookiesFile();
  if (cookiesFile) args.push('--cookies', cookiesFile);

  // Modern YouTube extraction needs a JS runtime; Node is already running us, so reuse it
  if (runtime.supportsJsRuntimes) args.push('--js-runtimes', `node:${process.execPath}`);

  if (process.env.FFMPEG_PATH) args.push('--ffmpeg-location', process.env.FFMPEG_PATH);

  return args;
}

let writableCookiesFile;

/**
 * yt-dlp rewrites its cookies file after each run, but secret-file mounts (e.g. Render's
 * /etc/secrets) are read-only, so work from a private copy in the temp directory.
 */
function getWritableCookiesFile() {
  const source = process.env.YTDLP_COOKIES_FILE;
  if (!source) return null;
  if (writableCookiesFile === undefined) {
    try {
      writableCookiesFile = path.join(os.tmpdir(), 'reelgrab-cookies.txt');
      fs.copyFileSync(source, writableCookiesFile);
      console.log(`🍪 Using yt-dlp cookies from ${source}`);
    } catch (err) {
      console.warn(`⚠️ Could not read YTDLP_COOKIES_FILE (${source}): ${err.message}`);
      writableCookiesFile = null;
    }
  }
  return writableCookiesFile;
}

export function isDemoUrl(cleanUrl) {
  return /instagram\.com\/(?:reel|p|tv)\/(?:demo|test)\/?$/i.test(cleanUrl);
}

/**
 * Returns { success, data, source } where `data` is safe to send to the browser and
 * `source` holds the server-only media URLs used by the stream / thumbnail proxies.
 * Results are cached briefly so preview streaming and downloads don't re-run extraction.
 */
export function getVideoMetadata(cleanUrl, platform) {
  const now = Date.now();
  for (const [key, entry] of metadataCache) {
    if (entry.expires <= now) metadataCache.delete(key);
  }

  const cached = metadataCache.get(cleanUrl);
  if (cached) return cached.promise;

  const promise = fetchMetadata(cleanUrl, platform).then((result) => {
    if (!result.success) metadataCache.delete(cleanUrl);
    return result;
  });
  metadataCache.set(cleanUrl, { expires: now + METADATA_TTL_MS, promise });
  return promise;
}

async function fetchMetadata(cleanUrl, platform) {
  if (isDemoUrl(cleanUrl)) {
    return {
      success: true,
      data: {
        id: 'demo-video',
        url: cleanUrl,
        platform: 'instagram',
        title: 'ReelGrab Demo Video — preview & download test',
        uploader: 'reelgrab_demo',
        duration: 10,
        durationFormatted: '0:10',
        width: 320,
        height: 176,
        quality: '360p',
        hasPreview: true,
        hasThumbnail: true
      },
      source: {
        direct: true,
        preview: { url: DEMO_SOURCE_URL, headers: {} },
        thumbnailUrl: DEMO_THUMBNAIL,
        playlistItem: null
      }
    };
  }

  const runtime = await getYtdlpRuntime();
  if (!runtime) {
    return {
      success: false,
      statusCode: 503,
      error: 'The video engine (yt-dlp) is not installed on the server. Run: python -m pip install -U "yt-dlp[default]"'
    };
  }

  try {
    const { stdout } = await execFileAsync(runtime.cmd, [...buildCommonArgs(runtime), '-J', cleanUrl], {
      maxBuffer: 64 * 1024 * 1024,
      timeout: 60000,
      windowsHide: true
    });

    let info = JSON.parse(stdout);
    let playlistItem = null;

    // Instagram carousel posts come back as a playlist; use the first entry that has a video
    if (info._type === 'playlist') {
      const entries = info.entries || [];
      const index = entries.findIndex((entry) => entry && hasVideo(entry));
      if (index === -1) {
        return { success: false, statusCode: 404, error: 'This post does not contain a video.' };
      }
      playlistItem = index + 1;
      info = {
        ...entries[index],
        title: entries[index].title || info.title,
        description: entries[index].description || info.description,
        uploader: entries[index].uploader || info.uploader,
        thumbnail: entries[index].thumbnail || info.thumbnail
      };
    }

    if (!hasVideo(info)) {
      return { success: false, statusCode: 404, error: 'No downloadable video was found at this link.' };
    }

    return buildResult(info, cleanUrl, platform, playlistItem, runtime);
  } catch (error) {
    return parseYtdlpError(error.stderr || error.message || '', platform);
  }
}

function hasVideo(info) {
  const formats = info.formats && info.formats.length ? info.formats : [info];
  return formats.some((f) => f.url && f.vcodec !== 'none' && f.ext !== 'mhtml');
}

function isHttpFormat(f) {
  return !f.protocol || f.protocol === 'https' || f.protocol === 'http';
}

function buildResult(info, cleanUrl, platform, playlistItem, runtime) {
  const formats = info.formats && info.formats.length ? info.formats : [info];

  // Single-file formats with audio + video can be played and proxied directly in the browser
  const progressive = formats
    .filter((f) => f.url && isHttpFormat(f) && f.vcodec !== 'none' && f.acodec !== 'none' && f.ext !== 'mhtml')
    .sort((a, b) => {
      const mp4Diff = (b.ext === 'mp4') - (a.ext === 'mp4');
      return mp4Diff || (b.height || 0) - (a.height || 0) || (b.tbr || 0) - (a.tbr || 0);
    });
  // Silent videos (no audio stream at all) only have video-only formats, which preview fine
  const hasAudioStreams = formats.some((f) => f.acodec && f.acodec !== 'none');
  const silentFallback = hasAudioStreams
    ? null
    : formats
      .filter((f) => f.url && isHttpFormat(f) && f.vcodec !== 'none' && f.ext === 'mp4')
      .sort((a, b) => (b.height || 0) - (a.height || 0))[0];
  const preview = progressive[0] || silentFallback || null;

  // With ffmpeg we merge the best video + audio streams; otherwise the best single file is the ceiling
  // (downloads prefer H.264, so report the best H.264 height when there is one)
  const videoFormats = formats.filter((f) => f.vcodec !== 'none' && f.ext !== 'mhtml');
  const h264 = videoFormats.filter((f) => f.vcodec && f.vcodec.startsWith('avc1'));
  const deliverable = runtime.hasFfmpeg ? (h264.length ? h264 : videoFormats) : progressive;
  const maxHeight = deliverable.reduce((max, f) => Math.max(max, f.height || 0), 0) || info.height || null;

  return {
    success: true,
    data: {
      id: info.id || 'video',
      url: cleanUrl,
      platform,
      title: pickTitle(info, platform),
      // Instagram's "uploader" is the display name; the handle lives in "channel"
      uploader: (platform === 'instagram' && info.channel) || info.uploader || info.channel || info.uploader_id || PLATFORM_NAMES[platform],
      duration: info.duration || null,
      durationFormatted: formatDuration(info.duration),
      width: info.width || null,
      height: info.height || null,
      quality: maxHeight ? `${maxHeight}p` : 'HD',
      hasPreview: Boolean(preview),
      hasThumbnail: Boolean(info.thumbnail),
      // YouTube rarely offers a single audio+video file any more, so preview with its own player
      embedUrl: platform === 'youtube' && info.id ? `https://www.youtube-nocookie.com/embed/${info.id}?rel=0` : null
    },
    source: {
      direct: false,
      preview: preview ? { url: preview.url, headers: preview.http_headers || {} } : null,
      thumbnailUrl: info.thumbnail || null,
      playlistItem
    }
  };
}

function pickTitle(info, platform) {
  // Instagram titles are generic ("Video by user"); the caption's first line reads better
  if (platform === 'instagram' && info.description) {
    const firstLine = info.description.split('\n').find((line) => line.trim());
    if (firstLine) return firstLine.trim().slice(0, 140);
  }
  return info.title || `${PLATFORM_NAMES[platform]} video`;
}

/**
 * Formats duration in seconds to M:SS or H:MM:SS
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return null;
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${String(mins).padStart(2, '0')}:${secs}` : `${mins}:${secs}`;
}

/**
 * Maps yt-dlp error output to standardized status codes and human-friendly messages.
 */
export function parseYtdlpError(stderr, platform) {
  const errStr = stderr.toLowerCase();
  const name = PLATFORM_NAMES[platform] || 'the site';

  const errorLine = stderr.split('\n').reverse().find((line) => line.includes('ERROR')) || stderr.slice(-500);
  console.error(`[YTDLP ERROR] ${errorLine.trim()}`);

  if (
    errStr.includes('wrong_version_number') ||
    errStr.includes('seqrite') ||
    errStr.includes('quick heal') ||
    errStr.includes('access to website is blocked')
  ) {
    return {
      success: false,
      statusCode: 503,
      error: `${name} is blocked on this network by a firewall or antivirus (e.g. Seqrite / Quick Heal). Allow the site in your web security settings or switch networks.`
    };
  }

  if (errStr.includes('confirm your age') || errStr.includes('age-restricted') || errStr.includes('inappropriate for some users')) {
    return { success: false, statusCode: 403, error: 'This video is age-restricted and cannot be downloaded without signing in.' };
  }

  if (errStr.includes('not a bot') || errStr.includes('sign in to confirm')) {
    return {
      success: false,
      statusCode: 429,
      error: 'YouTube is temporarily blocking requests from this server. Please try again in a few minutes.'
    };
  }

  if (errStr.includes('members-only') || errStr.includes('join this channel')) {
    return { success: false, statusCode: 403, error: 'This is a members-only video and cannot be downloaded.' };
  }

  if (errStr.includes('private video') || errStr.includes('account is private') || errStr.includes('is private')) {
    return { success: false, statusCode: 403, error: `This ${name} video is private.` };
  }

  if (errStr.includes('live event') || errStr.includes('is live') || errStr.includes('premieres in')) {
    return { success: false, statusCode: 400, error: 'Live streams and upcoming premieres cannot be downloaded.' };
  }

  if (errStr.includes('empty media response')) {
    return {
      success: false,
      statusCode: 404,
      error: 'Instagram did not return this post. It may be private, deleted, age-restricted, or only visible when logged in.'
    };
  }

  if (errStr.includes('no video in this post') || errStr.includes('no video formats found')) {
    return { success: false, statusCode: 404, error: 'This post does not contain a video.' };
  }

  if (errStr.includes('rate-limit') || errStr.includes('rate limit') || errStr.includes('429') || errStr.includes('too many requests') || errStr.includes('login required')) {
    return {
      success: false,
      statusCode: 429,
      error: `${name} is limiting requests right now, or the content requires login. Please try again in a minute.`
    };
  }

  if (errStr.includes('video unavailable') || errStr.includes('not found') || errStr.includes('404') || errStr.includes('unavailable') || errStr.includes('removed')) {
    return { success: false, statusCode: 404, error: 'This video could not be found. It may have been deleted or made unavailable.' };
  }

  if (errStr.includes('getaddrinfo') || errStr.includes('timed out') || errStr.includes('connection') || errStr.includes('urlopen error')) {
    return { success: false, statusCode: 502, error: `Could not reach ${name}. Check the server's internet connection and try again.` };
  }

  return {
    success: false,
    statusCode: 500,
    error: `Failed to extract the video from ${name}. Please check the link and try again.`
  };
}
