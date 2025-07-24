import { RateLimitError } from './errorHandler.js';

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 60000) { // Clean entries older than 1 minute past reset
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Run cleanup every minute

// Rate limiter factory
export function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    skip = () => false
  } = options;

  return async (req, res, next) => {
    // Check if we should skip this request
    if (await skip(req, res)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create rate limit data for this key
    let data = rateLimitStore.get(key);
    
    if (!data || now >= data.resetTime) {
      // Create new window
      data = {
        count: 0,
        resetTime: now + windowMs,
        firstRequest: now
      };
      rateLimitStore.set(key, data);
    }

    // Increment counter
    data.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - data.count));
    res.setHeader('X-RateLimit-Reset', new Date(data.resetTime).toISOString());

    // Check if limit exceeded
    if (data.count > max) {
      res.setHeader('Retry-After', Math.ceil((data.resetTime - now) / 1000));
      
      // Skip counting this request if configured
      if (skipFailedRequests) {
        data.count--;
      }
      
      return next(new RateLimitError(message));
    }

    // Handle response to potentially skip counting
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalSend = res.send;
      res.send = function(...args) {
        if (skipSuccessfulRequests && res.statusCode < 400) {
          data.count--;
        } else if (skipFailedRequests && res.statusCode >= 400) {
          data.count--;
        }
        return originalSend.apply(res, args);
      };
    }

    next();
  };
}

// Pre-configured rate limiters
export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many requests to this endpoint, please try again later.'
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: 'API rate limit exceeded, please slow down.',
  keyGenerator: (req) => req.user?.id || req.ip
});

// Sliding window rate limiter for more accurate limiting
export function createSlidingWindowRateLimiter(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    max = 10,
    message = 'Rate limit exceeded'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request log for this key
    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const requestLog = requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = requestLog.filter(timestamp => timestamp > windowStart);
    requests.set(key, validRequests);

    // Check if limit exceeded
    if (validRequests.length >= max) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = oldestRequest + windowMs;
      
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
      res.setHeader('Retry-After', Math.ceil((resetTime - now) / 1000));
      
      return next(new RateLimitError(message));
    }

    // Add current request
    validRequests.push(now);

    // Set headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - validRequests.length);

    next();
  };
}