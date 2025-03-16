// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Generic rate limiter creator with proper proxy handling
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true, 
    legacyHeaders: false,
    // Use proper IP source based on Express's trust proxy setting
    keyGenerator: (req) => {
      // Get IP from req.ip which uses Express's trust proxy configuration
      return req.ip || req.connection.remoteAddress;
    }
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
  max: 10, // 10 attempts
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