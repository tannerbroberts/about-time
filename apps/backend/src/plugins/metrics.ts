/**
 * Prometheus metrics plugin for monitoring
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestErrors = new promClient.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const cacheHitTotal = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key'],
  registers: [register],
});

const cacheMissTotal = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key'],
  registers: [register],
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

/**
 * Metrics plugin
 */
const metricsPlugin: FastifyPluginAsync = async (fastify) => {
  // Track active connections
  fastify.addHook('onRequest', async (request, reply) => {
    activeConnections.inc();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    activeConnections.dec();
  });

  // Track request metrics
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    (request as any).startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = (request as any).startTime;
    if (!startTime) return;

    const duration = (Date.now() - startTime) / 1000;
    const route = request.routeOptions.url || request.url;
    const method = request.method;
    const statusCode = reply.statusCode.toString();

    // Record metrics
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    httpRequestTotal.inc({ method, route, status_code: statusCode });

    // Track errors (4xx and 5xx)
    if (reply.statusCode >= 400) {
      httpRequestErrors.inc({ method, route, status_code: statusCode });
    }
  });

  // Metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return register.metrics();
  });

  // Expose metrics utilities for services
  fastify.decorate('metrics', {
    httpRequestDuration,
    httpRequestTotal,
    httpRequestErrors,
    databaseQueryDuration,
    cacheHitTotal,
    cacheMissTotal,
    activeConnections,
  });
};

export default fp(metricsPlugin, {
  name: 'metrics',
});

// Export metrics for direct use
export {
  register,
  httpRequestDuration,
  httpRequestTotal,
  httpRequestErrors,
  databaseQueryDuration,
  cacheHitTotal,
  cacheMissTotal,
  activeConnections,
};
