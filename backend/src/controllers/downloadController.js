import axios from 'axios';
import http from 'http';
import https from 'https';
import { validateInstagramUrl } from '../utils/urlValidator.js';
import { getReelMetadata } from '../services/ytdlpService.js';

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

/**
 * POST /api/info
 * Retrieves metadata (title, duration, thumbnail, direct link) for preview.
 */
export async function getInfoController(req, res) {
  const { url } = req.body;

  const validation = validateInstagramUrl(url);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }

  console.log(`[INFO] Fetching info for: ${validation.cleanUrl} at ${new Date().toISOString()}`);

  const result = await getReelMetadata(validation.cleanUrl);
  if (!result.success) {
    return res.status(result.statusCode).json({
      success: false,
      error: result.error
    });
  }

  return res.json({
    success: true,
    data: result.data
  });
}

/**
 * POST /api/download
 * Resolves Instagram Reel URL and streams the raw MP4 video stream to the user.
 */
export async function downloadController(req, res) {
  const { url } = req.body;

  const validation = validateInstagramUrl(url);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }

  console.log(`[DOWNLOAD] Processing download for: ${validation.cleanUrl} at ${new Date().toISOString()}`);

  const result = await getReelMetadata(validation.cleanUrl);
  if (!result.success) {
    return res.status(result.statusCode).json({
      success: false,
      error: result.error
    });
  }

  const { streamUrl, id } = result.data;

  try {
    const videoStreamResponse = await axios({
      method: 'GET',
      url: streamUrl,
      responseType: 'stream',
      timeout: 60000,
      httpAgent: httpAgent,
      httpsAgent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    const filename = `reel-${id}.mp4`;

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (videoStreamResponse.headers['content-length']) {
      res.setHeader('Content-Length', videoStreamResponse.headers['content-length']);
    }

    videoStreamResponse.data.pipe(res);

    videoStreamResponse.data.on('error', (streamErr) => {
      console.error('[STREAM ERROR]', streamErr.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Video stream interrupted.' });
      }
    });
  } catch (streamErr) {
    console.error('[PROXY ERROR]', streamErr.message);
    return res.status(500).json({
      success: false,
      error: 'Unable to stream video content from Instagram. Please try again later.'
    });
  }
}
