/**
 * Library CRUD routes
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { LibraryService } from '../services/library.service.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

// Create service instance
const libraryService = new LibraryService();

// Validation schemas
const createLibrarySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  laneTemplateId: z.string().optional(),
  visibility: z.enum(['private', 'unlisted', 'public']).optional(),
});

const updateLibrarySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  visibility: z.enum(['private', 'unlisted', 'public']).optional(),
});

const addTemplateSchema = z.object({
  templateId: z.string(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().optional(),
});

const updateMembershipSchema = z.object({
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().optional(),
});

export const libraryRoutes: FastifyPluginAsync = async (fastify) => {
  // All library routes require authentication
  fastify.addHook('preHandler', requireAuth);

  /**
   * List user's libraries
   * GET /api/libraries
   */
  fastify.get('/', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;

      const libraries = await libraryService.getLibraries(user.id);

      return reply.send({
        success: true,
        data: libraries,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to list libraries' });
    }
  });

  /**
   * Get single library by ID
   * GET /api/libraries/:id
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const library = await libraryService.getLibraryById(user.id, id);

      if (!library) {
        return reply.code(404).send({ error: 'NotFound', message: 'Library not found' });
      }

      return reply.send({
        success: true,
        data: library,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to get library' });
    }
  });

  /**
   * Create new library
   * POST /api/libraries
   */
  fastify.post('/', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const data = createLibrarySchema.parse(request.body);

      const created = await libraryService.createLibrary(user.id, data);

      return reply.code(201).send({
        success: true,
        data: created,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to create library' });
    }
  });

  /**
   * Update library metadata
   * PUT /api/libraries/:id
   */
  fastify.put('/:id', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const data = updateLibrarySchema.parse(request.body);

      const updated = await libraryService.updateLibrary(user.id, id, data);

      if (!updated) {
        return reply.code(404).send({ error: 'NotFound', message: 'Library not found' });
      }

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to update library' });
    }
  });

  /**
   * Delete library
   * DELETE /api/libraries/:id
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const deleted = await libraryService.deleteLibrary(user.id, id);

      if (!deleted) {
        return reply.code(404).send({ error: 'NotFound', message: 'Library not found' });
      }

      return reply.send({
        success: true,
        message: 'Library deleted successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to delete library' });
    }
  });

  /**
   * Get templates in library
   * GET /api/libraries/:id/templates
   */
  fastify.get('/:id/templates', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const templates = await libraryService.getLibraryTemplates(user.id, id);

      return reply.send({
        success: true,
        data: templates,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Library not found') {
        return reply.code(404).send({ error: 'NotFound', message: 'Library not found' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to get library templates' });
    }
  });

  /**
   * Add template to library
   * POST /api/libraries/:id/templates
   */
  fastify.post('/:id/templates', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const data = addTemplateSchema.parse(request.body);

      const membership = await libraryService.addTemplateToLibrary(user.id, {
        libraryId: id,
        ...data,
      });

      return reply.code(201).send({
        success: true,
        data: membership,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      if (error instanceof Error && (error.message === 'Library not found' || error.message === 'Template not found')) {
        return reply.code(404).send({ error: 'NotFound', message: error.message });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to add template to library' });
    }
  });

  /**
   * Update membership metadata
   * PUT /api/libraries/:id/templates/:templateId
   */
  fastify.put('/:id/templates/:templateId', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id, templateId } = request.params as { id: string; templateId: string };
      const data = updateMembershipSchema.parse(request.body);

      const updated = await libraryService.updateLibraryMembership(user.id, id, templateId, data);

      if (!updated) {
        return reply.code(404).send({ error: 'NotFound', message: 'Membership not found' });
      }

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to update membership' });
    }
  });

  /**
   * Remove template from library
   * DELETE /api/libraries/:id/templates/:templateId
   */
  fastify.delete('/:id/templates/:templateId', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id, templateId } = request.params as { id: string; templateId: string };

      const removed = await libraryService.removeTemplateFromLibrary(user.id, id, templateId);

      if (!removed) {
        return reply.code(404).send({ error: 'NotFound', message: 'Membership not found' });
      }

      return reply.send({
        success: true,
        message: 'Template removed from library',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to remove template from library' });
    }
  });

  /**
   * Export library as JSON
   * GET /api/libraries/:id/export
   */
  fastify.get('/:id/export', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const exportData = await libraryService.exportLibrary(user.id, id);

      return reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename="library-${id}-export.json"`)
        .send(exportData);
    } catch (error) {
      if (error instanceof Error && error.message === 'Library not found') {
        return reply.code(404).send({ error: 'NotFound', message: 'Library not found' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to export library' });
    }
  });

  /**
   * Import library from JSON
   * POST /api/libraries/import
   */
  fastify.post('/import', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const importData = request.body as {
        version: string;
        library: { name: string; description?: string; visibility?: string };
        templates: Array<{ templateData: Record<string, unknown>; membership?: Record<string, unknown> }>;
      };

      const libraryId = await libraryService.importLibrary(user.id, importData);

      return reply.code(201).send({
        success: true,
        data: { libraryId },
        message: 'Library imported successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to import library' });
    }
  });

  /**
   * Check library for circular references
   * GET /api/libraries/:id/check-cycles
   */
  fastify.get('/:id/check-cycles', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const cycles = await libraryService.detectExistingCycles(user.id, id);

      return reply.send({
        success: true,
        data: {
          hasCycles: cycles.length > 0,
          cycles,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to check for cycles' });
    }
  });
};
