/**
 * Redis client configuration
 */

import Redis from 'ioredis';
import pino from 'pino';
import { env } from './env.js';

// Create standalone logger for Redis (before Fastify is initialized)
const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Parse Redis URL
const redisUrl = new URL(env.REDIS_URL);

// Create Redis client
export const redis = new Redis({
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379', 10),
  password: redisUrl.password || undefined,
  retryStrategy: (times: number): number => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

// Connection event handlers
redis.on('connect', () => {
  logger.info('✓ Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error');
});

redis.on('close', () => {
  logger.info('Redis connection closed');
});

/**
 * Cache key prefix for organization
 */
export const CACHE_KEYS = {
  TEMPLATE: (userId: string, templateId: string) => `template:${userId}:${templateId}`,
  TEMPLATES: (userId: string) => `templates:${userId}`,
  PUBLIC_TEMPLATES: 'public_templates',
  SCHEDULE_LANES: (userId: string) => `schedule_lanes:${userId}`,
  DAILY_GOALS: (userId: string) => `daily_goals:${userId}`,
  DAILY_STATE: (userId: string, dateKey: string) => `daily_state:${userId}:${dateKey}`,
} as const;

/**
 * Cache TTL in seconds
 */
export const CACHE_TTL = {
  TEMPLATE: 3600, // 1 hour
  TEMPLATES: 3600, // 1 hour
  SCHEDULE_LANES: 300, // 5 minutes
  DAILY_GOALS: 3600, // 1 hour
  DAILY_STATE: 300, // 5 minutes
} as const;

/**
 * Helper to get cached data
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (error) {
    logger.error({ error, key }, 'Cache get error');
    return null;
  }
};

/**
 * Helper to set cached data
 */
export const setCache = async (key: string, value: unknown, ttl: number): Promise<void> => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error({ error, key, ttl }, 'Cache set error');
  }
};

/**
 * Helper to delete cached data
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error({ error, key }, 'Cache delete error');
  }
};

/**
 * Helper to delete cached data by pattern
 */
export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error({ error, pattern }, 'Cache delete pattern error');
  }
};

/**
 * Close Redis connection gracefully
 */
export const closeRedis = async (): Promise<void> => {
  await redis.quit();
};
