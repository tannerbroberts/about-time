/**
 * REST API routes for composite unit definitions
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { CompositeService } from '../services/composite.service.js';

const compositeService = new CompositeService();

// Zod schemas for validation
const compositionValueSchema = z.object({
  value: z.number(),
  lower: z.number().optional(),
  upper: z.number().optional(),
});

const createCompositeSchema = z.object({
  name: z.string().min(1).max(255),
  composition: z.record(z.string(), compositionValueSchema),
  changelog: z.string().optional(),
});

const updateCompositeSchema = z.object({
  composition: z.record(z.string(), compositionValueSchema),
  changelog: z.string().optional(),
});

const forkCompositeSchema = z.object({
  changelog: z.string().optional(),
});

const compositeIdSchema = z.object({
  id: z.string().uuid(),
});

export async function compositesRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/composites
   * Get all composites for the authenticated user
   */
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;

    try {
      const composites = await compositeService.getUserComposites(user.id);
      return reply.code(200).send({
        success: true,
        composites,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/composites/:id
   * Get a specific composite by ID
   */
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const params = compositeIdSchema.parse(request.params);

    try {
      const composite = await compositeService.getCompositeById(user.id, params.id);
      return reply.code(200).send({
        success: true,
        composite,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(404).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/composites/:id/versions
   * Get all versions of a composite
   */
  fastify.get('/:id/versions', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const params = compositeIdSchema.parse(request.params);

    try {
      const versions = await compositeService.getCompositeVersions(user.id, params.id);
      return reply.code(200).send({
        success: true,
        versions,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(404).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /api/composites
   * Create a new composite definition
   */
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const body = createCompositeSchema.parse(request.body);

    try {
      const composite = await compositeService.createComposite(user.id, body);
      return reply.code(201).send({
        success: true,
        composite,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(400).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PUT /api/composites/:id
   * Update a composite (creates a new version)
   */
  fastify.put('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const params = compositeIdSchema.parse(request.params);
    const body = updateCompositeSchema.parse(request.body);

    try {
      const composite = await compositeService.updateComposite(user.id, params.id, body);
      return reply.code(200).send({
        success: true,
        composite,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(400).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /api/composites/:id
   * Delete a composite
   */
  fastify.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const params = compositeIdSchema.parse(request.params);

    try {
      await compositeService.deleteComposite(user.id, params.id);
      return reply.code(200).send({
        success: true,
        message: 'Composite deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = errorMessage.includes('currently used') ? 409 : 404;
      return reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /api/composites/:id/fork
   * Fork a composite (create a copy with new ownership)
   */
  fastify.post('/:id/fork', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const params = compositeIdSchema.parse(request.params);
    const body = forkCompositeSchema.parse(request.body);

    try {
      const composite = await compositeService.forkComposite(user.id, params.id, body);
      return reply.code(201).send({
        success: true,
        composite,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(400).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /api/composites/:id/live-link
   * Create a live-linked reference to a composite
   */
  fastify.post('/:id/live-link', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const params = compositeIdSchema.parse(request.params);
    const body = forkCompositeSchema.parse(request.body);

    try {
      const composite = await compositeService.createLiveLink(user.id, params.id, body);
      return reply.code(201).send({
        success: true,
        composite,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(400).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /api/composites/:id/bulk-update-snapshots
   * Update all templates using this composite's snapshots
   */
  fastify.post('/:id/bulk-update-snapshots', { preHandler: requireAuth }, async (_request, reply) => {
    // TODO: Implement composite variable bulk update
    // This endpoint is a placeholder awaiting composite integration in templates
    try {
      return reply.code(200).send({
        success: true,
        updatedCount: 0,
        message: 'Bulk snapshot update endpoint ready (awaiting composite integration in templates)',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(400).send({
        success: false,
        error: errorMessage,
      });
    }
  });
}
