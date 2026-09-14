import rateLimit from 'express-rate-limit';

export const downloadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many download requests from this IP. Please try again after 60 seconds.'
  }
});
