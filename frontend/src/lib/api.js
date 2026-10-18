import axios from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const SUPPORTED_LINK = /(?:https?:\/\/)?(?:[\w-]+\.)*(?:instagram\.com|youtube\.com|youtu\.be|youtube-nocookie\.com)\/\S+/i;

/** Pulls the first Instagram/YouTube link out of pasted text (share sheets add extra words). */
export function extractLink(text) {
  const match = (text || '').match(SUPPORTED_LINK);
  return match ? match[0] : null;
}

/** Returns 'instagram' | 'youtube' | null for whatever text the user pasted. */
export function detectPlatform(text) {
  const link = extractLink(text);
  if (!link) return null;
  return /instagram\.com/i.test(link) ? 'instagram' : 'youtube';
}

export function mediaUrl(path, sourceUrl) {
  return `${API_BASE}${path}?url=${encodeURIComponent(sourceUrl)}`;
}

/** Always returns a string — hosts like Vercel answer unknown routes with `{ error: { code, message } }`. */
export function errorMessage(err, fallback) {
  const apiError = err.response?.data?.error;
  if (typeof apiError === 'string' && apiError) return apiError;
  if (err.code === 'ERR_NETWORK' || err.response?.status === 404 || err.response?.status === 405) {
    return 'The ReelGrab server is not reachable right now. Please try again later.';
  }
  return fallback;
}

// A 200 that isn't our JSON (e.g. a static host serving index.html) means the API isn't there
function unwrap(body) {
  if (!body || typeof body !== 'object' || !body.data) {
    throw Object.assign(new Error('Unexpected server response'), { code: 'ERR_NETWORK' });
  }
  return body.data;
}

export async function fetchVideoInfo(url) {
  const { data } = await axios.post(`${API_BASE}/api/info`, { url }, { timeout: 180000 });
  return unwrap(data);
}

export async function startDownloadJob(url) {
  const { data } = await axios.post(`${API_BASE}/api/download`, { url });
  return unwrap(data);
}

export async function getDownloadJob(jobId) {
  const { data } = await axios.get(`${API_BASE}/api/download/${jobId}`);
  return unwrap(data);
}

export function downloadFileUrl(jobId) {
  return `${API_BASE}/api/download/${jobId}/file`;
}

/** Hands the finished file to the browser's own download manager. */
export function saveFile(href, filename) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename || '';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
