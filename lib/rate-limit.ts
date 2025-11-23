/**
 * API Rate Limiting and Abuse Protection
 * Prevents brute force attacks and abuse of API endpoints
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    lastRequest: number;
  };
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

// Rate limiting configuration
const RATE_LIMITS = {
  // API endpoints
  '/api/chat': { requests: 10, windowMs: 60000 }, // 10 requests per minute
  '/api/generate': { requests: 5, windowMs: 60000 }, // 5 requests per minute
  '/api/anythingllm': { requests: 20, windowMs: 60000 }, // 20 requests per minute
  '/api/sow': { requests: 15, windowMs: 60000 }, // 15 requests per minute
  '/api/admin': { requests: 3, windowMs: 300000 }, // 3 requests per 5 minutes
  '/api/dashboard': { requests: 30, windowMs: 60000 }, // 30 requests per minute

  // Default limits
  default: { requests: 100, windowMs: 600000 } // 100 requests per 10 minutes
};

/**
 * Generate a unique key for rate limiting based on IP and endpoint
 */
function getRateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}

/**
 * Check if a request is allowed under rate limits
 */
export function checkRateLimit(ip: string, endpoint: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const key = getRateLimitKey(ip, endpoint);
  const config = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  const now = Date.now();

  // Clean old entries
  Object.keys(rateLimitStore).forEach(k => {
    if (rateLimitStore[k].resetTime < now) {
      delete rateLimitStore[k];
    }
  });

  let entry = rateLimitStore[key];

  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      lastRequest: now
    };
    rateLimitStore[key] = entry;

    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime: entry.resetTime,
      limit: config.requests
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit: config.requests
    };
  }

  // Increment count
  entry.count++;
  entry.lastRequest = now;

  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
    limit: config.requests
  };
}

/**
 * Express/Next.js middleware for rate limiting
 */
export function rateLimitMiddleware(endpoint: string) {
  return (req: any, res: any, next: any) => {
    try {
      // Get IP address (handle proxy headers)
      const ip = req.headers['x-forwarded-for'] ||
                 req.headers['x-real-ip'] ||
                 req.connection.remoteAddress ||
                 req.socket.remoteAddress ||
                 'unknown';

      // Clean IP address
      const cleanIp = Array.isArray(ip) ? ip[0] : ip?.split(',')[0]?.trim() || 'unknown';

      const result = checkRateLimit(cleanIp, endpoint);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime / 1000).toString());

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());

        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: retryAfter,
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Allow request to continue on error
    }
  };
}

/**
 * Track abuse patterns
 */
interface AbuseTracker {
  [key: string]: {
    suspiciousRequests: number;
    lastSuspicious: number;
    blocked: boolean;
  };
}

const abuseTracker: AbuseTracker = {};

/**
 * Check for abusive behavior patterns
 */
export function checkAbusiveBehavior(ip: string, endpoint: string, userAgent: string): {
  isAbusive: boolean;
  reason: string;
} {
  const key = `abuse:${ip}`;
  const now = Date.now();
  const windowMs = 300000; // 5 minutes

  let tracker = abuseTracker[key];

  if (!tracker) {
    tracker = {
      suspiciousRequests: 0,
      lastSuspicious: now,
      blocked: false
    };
    abuseTracker[key] = tracker;
  }

  // Reset if window has passed
  if (now - tracker.lastSuspicious > windowMs) {
    tracker.suspiciousRequests = 0;
    tracker.lastSuspicious = now;
  }

  // Check for suspicious patterns
  let isAbusive = false;
  let reason = '';

  // Check for rapid consecutive requests to same endpoint
  if (endpoint.includes('/admin') || endpoint.includes('/generate')) {
    tracker.suspiciousRequests++;

    if (tracker.suspiciousRequests > 10) {
      isAbusive = true;
      reason = 'Excessive rapid requests to sensitive endpoint';
    }
  }

  // Check for unusual user agents
  if (userAgent && !userAgent.includes('Mozilla') && !userAgent.includes('Chrome') && !userAgent.includes('Safari')) {
    tracker.suspiciousRequests++;

    if (tracker.suspiciousRequests > 5) {
      isAbusive = true;
      reason = 'Suspicious user agent pattern';
    }
  }

  // Check for IP patterns that might indicate automation
  if (ip && ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    // Local network, probably not abuse
    tracker.suspiciousRequests = Math.max(0, tracker.suspiciousRequests - 1);
  }

  if (isAbusive) {
    tracker.blocked = true;
    tracker.lastSuspicious = now;

    // Block for 1 hour
    setTimeout(() => {
      delete abuseTracker[key];
    }, 3600000);
  }

  return {
    isAbusive,
    reason
  };
}

/**
 * Get rate limit statistics for monitoring
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeIPs: string[];
  endpoints: { [key: string]: number };
} {
  const entries = Object.entries(rateLimitStore);
  const activeIPs = [...new Set(entries.map(([key]) => key.split(':')[0]))];

  const endpointCounts: { [key: string]: number } = {};
  entries.forEach(([key]) => {
    const [, endpoint] = key.split(':');
    endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
  });

  return {
    totalEntries: entries.length,
    activeIPs,
    endpoints: endpointCounts
  };
}

/**
 * Reset rate limit store (for testing or emergencies)
 */
export function resetRateLimit(): void {
  Object.keys(rateLimitStore).forEach(key => {
    delete rateLimitStore[key];
  });

  Object.keys(abuseTracker).forEach(key => {
    delete abuseTracker[key];
  });
}
