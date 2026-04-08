const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Increased from 5 to 20 for development
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes.'
});

// CORS configuration - VERY PERMISSIVE FOR DEVELOPMENT
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Still allow in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Custom MongoDB sanitization middleware - compatible with all Express versions
const mongoSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Remove keys that start with $ (MongoDB operators)
        if (key.startsWith('$')) {
          continue;
        }
        const value = obj[key];
        if (typeof value === 'string') {
          // Remove $ from start of strings
          sanitized[key] = value.startsWith('$') ? value.substring(1) : value;
        } else if (typeof value === 'object') {
          sanitized[key] = sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  // Don't modify req.query directly - it's read-only in newer Express
  // Instead, create a sanitized version if needed
  if (req.query) {
    Object.defineProperty(req, 'sanitizedQuery', {
      value: sanitize(req.query),
      writable: true,
      enumerable: true,
      configurable: true
    });
  }

  next();
};

module.exports = {
  helmet: helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
  }),
  mongoSanitize,
  cors: cors(corsOptions),
  generalLimiter,
  authLimiter
};