/**
 * Fastify server entry point
 * Updated to use production CORS origin
 */

import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { env } from './config/env.js';
import { corsPlugin } from './plugins/cors.js';
import { helmetPlugin } from './plugins/helmet.js';
import metricsPlugin from './plugins/metrics.js';
import { authRoutes } from './routes/auth.js';
import { compositesRoutes } from './routes/composites.js';
import { publicTemplateRoutes } from './routes/public-templates.js';
import { templateRoutes } from './routes/templates.js';
import { templateVariablesRoutes } from './routes/templateVariables.js';
import { libraryRoutes } from './routes/libraries.js';
import { scheduleRoutes } from './routes/schedule.js';
import { executeRoutes } from './routes/execute.js';
import { migrateRoutes } from './routes/migrate.js';
import { closeDatabase } from './db/client.js';
import { closeRedis } from './config/redis.js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './db/client.js';

// Create Fastify instance first so we can use its logger
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

// Run database migrations on startup in production
if (env.NODE_ENV === 'production') {
  try {
    fastify.log.info('🔄 Running database migrations...');
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    fastify.log.info('✅ Database migrations completed');
  } catch (error) {
    fastify.log.error({ error }, '❌ Migration failed');
    process.exit(1);
  }
}

// Register plugins
await fastify.register(fastifyCookie);
await fastify.register(corsPlugin);
await fastify.register(helmetPlugin);
await fastify.register(metricsPlugin);

// Global error handler for unhandled errors
fastify.setErrorHandler((error, request, reply) => {
  // Log the error with request context
  fastify.log.error({
    error,
    url: request.url,
    method: request.method,
    headers: request.headers,
  }, 'Unhandled error in request');

  // Check if response was already sent
  if (reply.sent) {
    return;
  }

  // Return a proper 500 error instead of Fastify's default 503
  return reply.code(500).send({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
  });
});

// Health check endpoint
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(compositesRoutes, { prefix: '/api/composites' });
await fastify.register(publicTemplateRoutes, { prefix: '/api/public-templates' });
await fastify.register(templateRoutes, { prefix: '/api/templates' });
await fastify.register(templateVariablesRoutes, { prefix: '/api/template-variables' });
await fastify.register(libraryRoutes, { prefix: '/api/libraries' });
await fastify.register(scheduleRoutes, { prefix: '/api/schedule' });
await fastify.register(executeRoutes, { prefix: '/api/execute' });
await fastify.register(migrateRoutes, { prefix: '/api/migrate' });

// Graceful shutdown handler
const closeGracefully = async (signal: string): Promise<void> => {
  fastify.log.info(`Received ${signal}, closing server...`);
  await fastify.close();
  await closeDatabase();
  await closeRedis();
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
