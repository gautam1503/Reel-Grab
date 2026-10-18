import rateLimit from 'express-rate-limit';

const message = (error) => ({ success: false, error });

// Metadata lookups and new download jobs each spawn yt-dlp, so they are limited tightly
export const infoRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many requests from this IP. Please try again in a minute.')
});

export const downloadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many download requests from this IP. Please try again in a minute.')
});

// Progress polling, video range requests and thumbnails are cheap and frequent
export const mediaRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many requests from this IP. Please slow down.')
});
