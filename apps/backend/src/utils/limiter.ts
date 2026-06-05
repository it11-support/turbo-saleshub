import rateLimit from "express-rate-limit";

export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too Many Requests",
    message: "Too many requests, please try again after an hour",
  }
})

export const imageReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  message: {
    message: 'Too many image requests, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
