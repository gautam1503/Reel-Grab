/**
 * Validates and normalizes Instagram Reel / Post URLs.
 */
const INSTAGRAM_URL_REGEX = /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i;

export function validateInstagramUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL is required.' };
  }

  const trimmed = rawUrl.trim();

  // Basic check for URL format
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { isValid: false, error: 'URL must begin with http:// or https://' };
  }

  const match = trimmed.match(INSTAGRAM_URL_REGEX);
  if (!match) {
    return {
      isValid: false,
      error: 'Invalid Instagram Reel URL. Please enter a link matching instagram.com/reel/... or instagram.com/p/...'
    };
  }

  const mediaId = match[1];
  const cleanUrl = `https://www.instagram.com/reel/${mediaId}/`;

  return {
    isValid: true,
    cleanUrl,
    mediaId
  };
}
