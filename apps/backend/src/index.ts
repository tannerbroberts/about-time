/**
 * Fastify server entry point
 */

import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { env } from './config/env.js';
import { corsPlugin } from './plugins/cors.js';
import { helmetPlugin } from './plugins/helmet.js';
import { authRoutes } from './routes/auth.js';
import { closeDatabase } from './db/client.js';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// Register plugins
await fastify.register(fastifyCookie);
await fastify.register(corsPlugin);
await fastify.register(helmetPlugin);

// Health check endpoint
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });

// Placeholder routes for future phases
fastify.get('/api/templates', async () => ({ message: 'Templates API - Phase 3' }));
fastify.get('/api/schedule/lanes', async () => ({ message: 'Schedule API - Phase 4' }));
fastify.get('/api/execute/daily-state/:dateKey', async () => ({ message: 'Execute API - Phase 4' }));

// Graceful shutdown handler
const closeGracefully = async (signal: string): Promise<void> => {
  fastify.log.info(`Received ${signal}, closing server...`);
  await fastify.close();
  await closeDatabase();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start server
try {
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
  fastify.log.info(`🚀 Server listening on http://localhost:${env.PORT}`);
  fastify.log.info(`📝 Environment: ${env.NODE_ENV}`);
  fastify.log.info(`🔒 CORS origin: ${env.CORS_ORIGIN}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
