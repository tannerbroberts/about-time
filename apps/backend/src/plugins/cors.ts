/**
 * CORS plugin configuration
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { env } from '../config/env.js';

const corsPluginImpl: FastifyPluginAsync = async (fastify) => {
  fastify.log.info('CORS plugin loaded');

  // Add CORS headers to all responses using onSend hook
  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    const origin = request.headers.origin;

    fastify.log.info({ origin, allowedOrigin: env.CORS_ORIGIN, url: request.url, method: request.method }, 'CORS onSend hook called');

    // Check if origin matches allowed origin
    if (origin === env.CORS_ORIGIN) {
      fastify.log.info('Setting CORS headers for matching origin');
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      reply.header('Access-Control-Expose-Headers', 'Content-Type, Authorization');
    }
  });

  // Handle OPTIONS preflight requests separately
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method === 'OPTIONS') {
      const origin = request.headers.origin;
      if (origin === env.CORS_ORIGIN) {
        reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Access-Control-Allow-Credentials', 'true');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
      return reply.code(204).send();
    }
  });

  fastify.log.info('CORS hooks registered');
};

export const corsPlugin = fastifyPlugin(corsPluginImpl, {
  name: 'cors-plugin',
  fastify: '5.x',
});
