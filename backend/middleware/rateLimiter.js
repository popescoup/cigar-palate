// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Generic rate limiter creator
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific limiters for different endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  message: { 
    error: 'Too many login attempts. Please try again after 15 minutes.' 
  }
});

const verificationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: { 
    error: 'Too many verification attempts. Please try again after 1 hour.' 
  }
});

const resendVerificationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // 2 resend attempts
  message: { 
    error: 'Too many verification email requests. Please try again after 1 hour.' 
  }
});

module.exports = {
  authLimiter,
  verificationLimiter,
  resendVerificationLimiter
};