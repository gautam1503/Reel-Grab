/**
 * Validates and normalizes Instagram (Reels / Posts / IGTV) and YouTube (videos / Shorts) URLs.
 */
const INSTAGRAM_REGEX = /^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(reels?|p|tv)\/([A-Za-z0-9_-]+)/i;

const YOUTUBE_REGEXES = [
  /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})/i,
  /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/i,
  /^(?:https?:\/\/)?youtu\.be\/([A-Za-z0-9_-]{11})/i,
  /^(?:https?:\/\/)?(?:www\.)?youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})/i
];

// Share sheets often paste extra text around the link ("Check this out https://...")
const LINK_IN_TEXT_REGEX = /(?:https?:\/\/)?(?:[\w-]+\.)*(?:instagram\.com|youtube\.com|youtu\.be|youtube-nocookie\.com)\/\S+/i;

export function validateVideoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'Please paste an Instagram or YouTube link.' };
  }

  const found = rawUrl.trim().match(LINK_IN_TEXT_REGEX);
  if (!found) {
    return {
      isValid: false,
      error: 'Unsupported link. Paste an Instagram Reel/Post link or a YouTube video/Shorts link.'
    };
  }
  const candidate = found[0];

  const igMatch = candidate.match(INSTAGRAM_REGEX);
  if (igMatch) {
    const kind = igMatch[1].toLowerCase().startsWith('reel') ? 'reel' : igMatch[1].toLowerCase();
    const mediaId = igMatch[2];
    return {
      isValid: true,
      platform: 'instagram',
      mediaId,
      cleanUrl: `https://www.instagram.com/${kind}/${mediaId}/`
    };
  }

  for (const regex of YOUTUBE_REGEXES) {
    const ytMatch = candidate.match(regex);
    if (ytMatch) {
      const mediaId = ytMatch[1];
      return {
        isValid: true,
        platform: 'youtube',
        mediaId,
        cleanUrl: `https://www.youtube.com/watch?v=${mediaId}`
      };
    }
  }

  return {
    isValid: false,
    error: 'That link does not point to a video. Use instagram.com/reel/..., instagram.com/p/..., youtube.com/watch?v=... or youtube.com/shorts/...'
  };
}
