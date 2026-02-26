/**
 * Security headers plugin configuration
 */

import type { FastifyPluginAsync } from 'fastify';
import fastifyHelmet from '@fastify/helmet';

export const helmetPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Allow frontend to load resources
  });
};
