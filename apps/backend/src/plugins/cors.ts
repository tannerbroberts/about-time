/**
 * CORS plugin configuration
 */

import type { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';
import { env } from '../config/env.js';

export const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
};
