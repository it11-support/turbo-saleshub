import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
})

export const imageReadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: {
    message: 'Too many image requests, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
