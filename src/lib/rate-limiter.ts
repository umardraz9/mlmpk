import { LRUCache } from 'lru-cache';
import { logger } from './logger';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

class RateLimiter {
  private cache: LRUCache<string, number[]>;

  constructor() {
    this.cache = new LRUCache<string, number[]>({
      max: 1000,
      ttl: 60 * 60 * 1000, // 1 hour
    });
  }

  async checkLimit(
    identifier: string,
    limit: number = 30,
    windowMs: number = 3600000 // 1 hour
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const timestamps = this.cache.get(identifier) || [];
      
      // Filter out old timestamps outside the window
      const recentTimestamps = timestamps.filter(t => now - t < windowMs);
      
      const remaining = Math.max(0, limit - recentTimestamps.length);
      const resetTime = recentTimestamps.length > 0 
        ? Math.min(...recentTimestamps) + windowMs 
        : now + windowMs;

      if (recentTimestamps.length >= limit) {
        logger.warn(`Rate limit exceeded for ${identifier}`, {
          limit,
          attempts: recentTimestamps.length,
          resetTime: new Date(resetTime)
        }, 'RATE_LIMIT');

        return {
          success: false,
          limit,
          remaining: 0,
          resetTime
        };
      }

      // Add current timestamp
      recentTimestamps.push(now);
      this.cache.set(identifier, recentTimestamps);

      return {
        success: true,
        limit,
        remaining: remaining - 1,
        resetTime
      };

    } catch (error) {
      logger.error('Rate limit check failed', error, 'RATE_LIMIT');
      // Fail open - allow the request if rate limiting fails
      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetTime: Date.now() + windowMs
      };
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Rate limiting presets for different endpoints
export const rateLimits = {
  // Authentication endpoints
  login: { limit: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  register: { limit: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
  forgotPassword: { limit: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
  
  // API endpoints
  api: { limit: 100, window: 60 * 60 * 1000 }, // 100 requests per hour
  apiStrict: { limit: 30, window: 60 * 60 * 1000 }, // 30 requests per hour
  
  // Social features
  messages: { limit: 50, window: 60 * 60 * 1000 }, // 50 messages per hour
  posts: { limit: 20, window: 60 * 60 * 1000 }, // 20 posts per hour
  comments: { limit: 100, window: 60 * 60 * 1000 }, // 100 comments per hour
  
  // MLM actions
  referrals: { limit: 10, window: 24 * 60 * 60 * 1000 }, // 10 referrals per day
  withdrawals: { limit: 5, window: 24 * 60 * 60 * 1000 }, // 5 withdrawals per day
  
  // Payment operations
  payments: { limit: 50, window: 60 * 60 * 1000 }, // 50 payment operations per hour
  adminPayments: { limit: 200, window: 60 * 60 * 1000 }, // 200 admin payment operations per hour
};

// Main rate limiting function
export async function rateLimit(
  identifier: string,
  preset: keyof typeof rateLimits = 'api'
): Promise<RateLimitResult> {
  const config = rateLimits[preset];
  return rateLimiter.checkLimit(identifier, config.limit, config.window);
}

// Legacy function for backward compatibility
export async function checkRateLimit(userId: string, limit: number = 30): Promise<RateLimitResult> {
  const result = await rateLimiter.checkLimit(userId, limit);
  return result;
}

// Helper to get client identifier
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}

// Middleware helper for Next.js API routes
export async function withRateLimit(
  request: Request,
  preset: keyof typeof rateLimits = 'api'
) {
  const identifier = getClientIdentifier(request);
  const result = await rateLimit(identifier, preset);
  
  return {
    ...result,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    }
  };
}

export async function getUserRateLimitInfo(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, 30);
}
