/**
 * AI Rate Limiter & Circuit Breaker
 * Protects AI endpoints from abuse and handles failures gracefully
 */

const NodeCache = require('node-cache');

// In-memory request cache (TTL: 5 minutes)
const aiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Rate limiting storage
const rateLimitStore = new Map();

// Circuit breaker states
const circuitBreakers = new Map();

const CIRCUIT_BREAKER_THRESHOLD = 5; // failures before opening
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute before trying again
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10; // max requests per window

/**
 * Rate Limiter Middleware
 * Limits AI requests per user
 */
const aiRateLimiter = (req, res, next) => {
  const userId = req.user?._id?.toString() || req.ip;
  const now = Date.now();
  
  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const userLimit = rateLimitStore.get(userId);
  
  // Reset if window passed
  if (now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  // Check limit
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return res.status(429).json({
      success: false,
      message: 'AI request limit exceeded. Please try again later.',
      retryAfter,
      fallback: true
    });
  }
  
  userLimit.count++;
  next();
};

/**
 * Circuit Breaker Middleware
 * Prevents cascade failures when AI service is down
 */
const circuitBreaker = (serviceName) => {
  return (req, res, next) => {
    const cb = circuitBreakers.get(serviceName) || { 
      state: 'CLOSED', 
      failures: 0, 
      lastFailure: null 
    };
    
    // Check if circuit is OPEN
    if (cb.state === 'OPEN') {
      const now = Date.now();
      if (now - cb.lastFailure > CIRCUIT_BREAKER_TIMEOUT) {
        // Try half-open
        cb.state = 'HALF_OPEN';
        circuitBreakers.set(serviceName, cb);
        console.log(`[CircuitBreaker] ${serviceName}: HALF_OPEN - attempting recovery`);
      } else {
        return res.status(503).json({
          success: false,
          message: 'AI service temporarily unavailable. Using fallback mode.',
          fallback: true,
          retryAfter: Math.ceil((CIRCUIT_BREAKER_TIMEOUT - (now - cb.lastFailure)) / 1000)
        });
      }
    }
    
    // Attach circuit breaker to response for tracking
    req.circuitBreaker = {
      name: serviceName,
      recordSuccess: () => {
        cb.failures = 0;
        cb.state = 'CLOSED';
        circuitBreakers.set(serviceName, cb);
      },
      recordFailure: () => {
        cb.failures++;
        cb.lastFailure = Date.now();
        if (cb.failures >= CIRCUIT_BREAKER_THRESHOLD) {
          cb.state = 'OPEN';
          console.log(`[CircuitBreaker] ${serviceName}: OPEN - too many failures`);
        }
        circuitBreakers.set(serviceName, cb);
      }
    };
    
    next();
  };
};

/**
 * Cache Middleware
 * Caches AI responses to reduce API calls
 */
const aiCacheMiddleware = (keyGenerator) => {
  return (req, res, next) => {
    const cacheKey = keyGenerator(req);
    const cached = aiCache.get(cacheKey);
    
    if (cached) {
      console.log('[AICache] Cache hit for:', cacheKey);
      return res.json({
        success: true,
        data: cached,
        cached: true,
        cachedAt: aiCache.getTtl(cacheKey)
      });
    }
    
    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (data.success && data.data) {
        aiCache.set(cacheKey, data.data);
        console.log('[AICache] Cached response for:', cacheKey);
      }
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Request Queue for heavy AI operations
 * Prevents overwhelming the AI service
 */
class AIRequestQueue {
  constructor(maxConcurrent = 3) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
  }
  
  async enqueue(operation, priority = 0) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject, priority });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.process();
    });
  }
  
  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const { operation, resolve, reject } = this.queue.shift();
    
    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

const aiQueue = new AIRequestQueue(3);

/**
 * Queue middleware
 */
const aiQueueMiddleware = (priority = 0) => {
  return (req, res, next) => {
    req.aiQueue = {
      enqueue: (operation) => aiQueue.enqueue(operation, priority)
    };
    next();
  };
};

/**
 * Clear cache for specific user or pattern
 */
const clearAICache = (pattern) => {
  const keys = aiCache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      aiCache.del(key);
    }
  });
};

/**
 * Get rate limit status for user
 */
const getRateLimitStatus = (userId) => {
  const userLimit = rateLimitStore.get(userId);
  if (!userLimit) {
    return { remaining: RATE_LIMIT_MAX_REQUESTS, resetIn: 0 };
  }
  
  const now = Date.now();
  if (now > userLimit.resetTime) {
    return { remaining: RATE_LIMIT_MAX_REQUESTS, resetIn: 0 };
  }
  
  return {
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - userLimit.count),
    resetIn: Math.ceil((userLimit.resetTime - now) / 1000)
  };
};

module.exports = {
  aiRateLimiter,
  circuitBreaker,
  aiCacheMiddleware,
  aiQueueMiddleware,
  clearAICache,
  getRateLimitStatus,
  aiCache
};
