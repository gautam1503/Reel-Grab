import axios from 'axios';
import { validateVideoUrl } from '../utils/urlValidator.js';
import { httpAgent, httpsAgent } from '../utils/httpAgents.js';
import { getVideoMetadata } from '../services/ytdlpService.js';
import { createDownloadJob, getJob, toPublicJob } from '../services/downloadJobs.js';

const MAX_DURATION_SECONDS = Number(process.env.MAX_DURATION_SECONDS) || 2 * 60 * 60;

/**
 * Validates the URL and resolves (cached) metadata, sending the error response itself on failure.
 */
async function resolveMetadata(rawUrl, res) {
  const validation = validateVideoUrl(rawUrl);
  if (!validation.isValid) {
    res.status(400).json({ success: false, error: validation.error });
    return null;
  }

  const result = await getVideoMetadata(validation.cleanUrl, validation.platform);
  if (!result.success) {
    res.status(result.statusCode).json({ success: false, error: result.error });
    return null;
  }
  return result;
}

/**
 * POST /api/info
 * Retrieves metadata (title, uploader, duration, quality) for the preview card.
 */
export async function getInfoController(req, res) {
  console.log(`[INFO] ${req.body?.url} at ${new Date().toISOString()}`);
  const result = await resolveMetadata(req.body?.url, res);
  if (!result) return;
  return res.json({ success: true, data: result.data });
}

/**
 * POST /api/download
 * Starts a background download job and returns its id for progress polling.
 */
export async function startDownloadController(req, res) {
  const result = await resolveMetadata(req.body?.url, res);
  if (!result) return;

  if (result.data.duration && result.data.duration > MAX_DURATION_SECONDS) {
    return res.status(413).json({
      success: false,
      error: `Videos longer than ${Math.round(MAX_DURATION_SECONDS / 60)} minutes can't be downloaded.`
    });
  }

  const job = createDownloadJob(result);
  if (!job) {
    return res.status(503).json({
      success: false,
      error: 'The server is busy with other downloads. Please try again in a few seconds.'
    });
  }

  console.log(`[DOWNLOAD] Job ${job.id} started for ${result.data.url}`);
  return res.status(202).json({ success: true, data: toPublicJob(job) });
}

/**
 * GET /api/download/:jobId
 * Reports job progress.
 */
export function downloadStatusController(req, res) {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: 'This download has expired. Please start it again.' });
  }
  return res.json({ success: true, data: toPublicJob(job) });
}

/**
 * GET /api/download/:jobId/file
 * Sends the finished MP4 as an attachment so the browser saves it natively.
 */
export function downloadFileController(req, res) {
  const job = getJob(req.params.jobId);
  if (!job || job.status !== 'ready') {
    return res.status(404).json({ success: false, error: 'This download has expired. Please start it again.' });
  }
  return res.download(job.filePath, job.filename, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to send the video file.' });
    }
  });
}

/**
 * GET /api/stream?url=
 * Proxies the playable preview stream (with Range support) so the browser can play it
 * even when the CDN URL is tied to the server's IP or rejects cross-site requests.
 */
export async function streamController(req, res) {
  const result = await resolveMetadata(req.query.url, res);
  if (!result) return;

  const preview = result.source.preview;
  if (!preview) {
    return res.status(404).json({ success: false, error: 'No inline preview is available for this video.' });
  }

  const headers = { ...preview.headers, 'Accept-Encoding': 'identity' };
  if (req.headers.range) headers.Range = req.headers.range;

  await pipeUpstream(req, res, preview.url, headers, ['content-type', 'content-length', 'content-range', 'accept-ranges'], 'no-store');
}

/**
 * GET /api/thumbnail?url=
 * Proxies the thumbnail image (Instagram's CDN blocks hotlinking from other sites).
 */
export async function thumbnailController(req, res) {
  const result = await resolveMetadata(req.query.url, res);
  if (!result) return;

  if (!result.source.thumbnailUrl) {
    return res.status(404).json({ success: false, error: 'No thumbnail available.' });
  }
  await pipeUpstream(req, res, result.source.thumbnailUrl, {}, ['content-type', 'content-length'], 'public, max-age=3600');
}

async function pipeUpstream(req, res, url, headers, forwardHeaders, cacheControl) {
  const controller = new AbortController();
  // res (not req) 'close' fires when the browser drops the connection, e.g. on seek
  res.on('close', () => controller.abort());

  try {
    const upstream = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      httpAgent,
      httpsAgent,
      signal: controller.signal,
      validateStatus: (status) => status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: '*/*',
        ...headers
      }
    });

    res.status(upstream.status);
    for (const name of forwardHeaders) {
      if (upstream.headers[name]) res.setHeader(name, upstream.headers[name]);
    }
    res.setHeader('Cache-Control', cacheControl);
    upstream.data.on('error', () => res.destroy());
    upstream.data.pipe(res);
  } catch (err) {
    if (axios.isCancel(err)) return;
    console.error('[PROXY ERROR]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: 'Unable to load media from the source. Please try again.' });
    }
  }
}
