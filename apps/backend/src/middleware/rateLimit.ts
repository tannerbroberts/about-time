/**
 * Rate limiting middleware using Redis
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../config/redis.js';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Optional key prefix
}

/**
 * Create a rate limit middleware
 */
export const createRateLimiter = (config: RateLimitConfig) => {
  const { windowMs, maxRequests, keyPrefix = 'ratelimit' } = config;
  const windowSeconds = Math.floor(windowMs / 1000);

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Get client identifier (user ID if authenticated, IP otherwise)
    const clientId =
      (request as any).user?.id || // From auth middleware
      request.ip ||
      'unknown';

    const key = `${keyPrefix}:${clientId}`;

    try {
      // Increment counter
      const requests = await redis.incr(key);

      // Set expiry on first request
      if (requests === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Check if limit exceeded
      if (requests > maxRequests) {
        const ttl = await redis.ttl(key);

        return reply.code(429).send({
          success: false,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${ttl} seconds.`,
          retryAfter: ttl,
        });
      }

      // Add rate limit headers
      reply.header('X-RateLimit-Limit', maxRequests);
      reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - requests));
      reply.header('X-RateLimit-Reset', Date.now() + (windowSeconds * 1000));
    } catch (error) {
      // If Redis fails, allow request through (fail open)
      request.log.error({ error }, 'Rate limit check failed');
    }
  };
};

/**
 * Predefined rate limiters
 */

// General API rate limit: 100 requests per minute
export const generalRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyPrefix: 'api',
});

// Auth rate limit: 5 requests per minute (stricter for security)
export const authRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  keyPrefix: 'auth',
});

// Migration rate limit: 1 request per 5 minutes
export const migrationRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 1,
  keyPrefix: 'migrate',
});
