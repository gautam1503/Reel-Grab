import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Executes yt-dlp to extract video metadata and direct video stream URL.
 * Uses `python -m yt_dlp` to ensure cross-platform execution.
 */
export async function getReelMetadata(cleanUrl) {
  // Demo Mode fallback for restricted firewalled networks
  if (cleanUrl.toLowerCase().includes('/demo') || cleanUrl.toLowerCase().includes('/test')) {
    return {
      success: true,
      data: {
        id: 'demo-reel-101',
        title: '✨ ReelGrab Demo Video — HD MP4 Stream & Download Test',
        thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80',
        duration: 15,
        durationFormatted: '0:15',
        uploader: 'reelgrab_official',
        width: 1080,
        height: 1920,
        streamUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
      }
    };
  }

  const args = [
    '-m', 'yt_dlp',
    '--dump-json',
    '--no-warnings',
    '--no-playlist',
    '--no-call-home'
  ];

  // Optional proxy support for networks with endpoint filtering/firewalls
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) {
    args.push('--proxy', proxyUrl);
  }

  args.push(cleanUrl);

  try {
    const { stdout } = await execFileAsync('python', args, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 30000 // 30 seconds max timeout
    });

    const metadata = JSON.parse(stdout.trim());

    // Find best direct mp4 video stream URL
    let streamUrl = metadata.url;
    if (metadata.formats && metadata.formats.length > 0) {
      // Pick best mp4 format with video+audio or highest quality video
      const mp4Formats = metadata.formats.filter(f => f.ext === 'mp4' || f.vcodec !== 'none');
      if (mp4Formats.length > 0) {
        const bestFormat = mp4Formats.reduce((prev, curr) => {
          return (curr.filesize || curr.tbr || 0) > (prev.filesize || prev.tbr || 0) ? curr : prev;
        });
        streamUrl = bestFormat.url || streamUrl;
      }
    }

    return {
      success: true,
      data: {
        id: metadata.id || 'reel',
        title: metadata.title || metadata.description || 'Instagram Reel',
        thumbnail: metadata.thumbnail || null,
        duration: metadata.duration || null,
        durationFormatted: formatDuration(metadata.duration),
        uploader: metadata.uploader || metadata.uploader_id || 'Instagram User',
        width: metadata.width || null,
        height: metadata.height || null,
        streamUrl: streamUrl
      }
    };
  } catch (error) {
    const stderr = error.stderr || error.message || '';
    const errStr = stderr.toLowerCase();

    // Check if network firewall / Seqrite / Quick Heal is blocking instagram.com
    const isFirewallBlock =
      errStr.includes('wrong_version_number') ||
      errStr.includes('seqrite') ||
      errStr.includes('quick heal') ||
      errStr.includes('access to website is blocked');

    if (isFirewallBlock) {
      console.log(`[FIREWALL BLOCK] Local antivirus/firewall blocked Instagram for ${cleanUrl}.`);
      return {
        success: false,
        statusCode: 503,
        error: 'Instagram access is blocked on this PC by Endpoint Security / Firewall (Seqrite / Quick Heal). Please allow www.instagram.com in Quick Heal/Seqrite Web Security settings or switch to an unblocked network (like mobile hotspot) to download the exact video.'
      };
    }

    return parseYtdlpError(stderr);
  }
}

/**
 * Formats duration in seconds to M:SS or H:MM:SS
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Maps yt-dlp error output to standardized status codes and human-friendly messages.
 */
function parseYtdlpError(stderr) {
  const errStr = stderr.toLowerCase();

  // Network firewall / Antivirus / Endpoint protection block (e.g. Seqrite, Quick Heal, corporate proxy)
  if (
    errStr.includes('wrong_version_number') ||
    errStr.includes('seqrite') ||
    errStr.includes('quick heal') ||
    errStr.includes('access to website is blocked')
  ) {
    return {
      success: false,
      statusCode: 503,
      error: 'Instagram access is blocked on this computer/network by Endpoint Security or Firewall (e.g., Seqrite / Quick Heal). Please allow www.instagram.com in your web security settings or switch networks.'
    };
  }

  if (errStr.includes('private') || errStr.includes('login required') || errStr.includes('account is private')) {
    return {
      success: false,
      statusCode: 403,
      error: 'This Instagram Reel is from a private account or requires login.'
    };
  }

  if (errStr.includes('not found') || errStr.includes('404') || errStr.includes('unavailable') || errStr.includes('unable to extract')) {
    return {
      success: false,
      statusCode: 404,
      error: 'The requested Reel could not be found. It may have been deleted or removed.'
    };
  }

  if (errStr.includes('429') || errStr.includes('too many requests') || errStr.includes('rate limit')) {
    return {
      success: false,
      statusCode: 429,
      error: 'Instagram rate limits reached. Please wait a moment and try again.'
    };
  }

  return {
    success: false,
    statusCode: 500,
    error: 'Failed to extract video from Instagram. Please verify the URL or ensure Instagram is accessible on your network.'
  };
}

