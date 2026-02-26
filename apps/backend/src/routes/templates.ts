/**
 * Template CRUD routes
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TemplateService } from '../services/template.service.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

// Create service instance
const templateService = new TemplateService();

// Validation schemas
const createTemplateSchema = z.object({
  template: z.any(), // Template type from core library
});

const updateTemplateSchema = z.object({
  template: z.any(), // Template type from core library
});

const listTemplatesSchema = z.object({
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  templateType: z.enum(['busy', 'lane']).optional(),
  searchIntent: z.string().optional(),
  sortBy: z.enum(['updatedAt', 'createdAt', 'intent']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const templateRoutes: FastifyPluginAsync = async (fastify) => {
  // All template routes require authentication
  fastify.addHook('preHandler', requireAuth);

  /**
   * List templates with pagination and filtering
   * GET /api/templates?offset=0&limit=50&templateType=lane&searchIntent=breakfast
   */
  fastify.get('/', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const query = listTemplatesSchema.parse(request.query);

      const result = await templateService.getTemplates(user.id, query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to list templates' });
    }
  });

  /**
   * Get single template by ID
   * GET /api/templates/:id
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const template = await templateService.getTemplateById(user.id, id);

      if (!template) {
        return reply.code(404).send({ error: 'NotFound', message: 'Template not found' });
      }

      return reply.send({
        success: true,
        data: template,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to get template' });
    }
  });

  /**
   * Create new template
   * POST /api/templates
   */
  fastify.post('/', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { template } = createTemplateSchema.parse(request.body);

      const created = await templateService.createTemplate(user.id, template);

      return reply.code(201).send({
        success: true,
        data: created,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to create template' });
    }
  });

  /**
   * Update existing template
   * PUT /api/templates/:id
   */
  fastify.put('/:id', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const { template } = updateTemplateSchema.parse(request.body);

      // Verify template ID matches
      if (template.id !== id) {
        return reply.code(400).send({ error: 'BadRequest', message: 'Template ID mismatch' });
      }

      const updated = await templateService.updateTemplate(user.id, template);

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.code(404).send({ error: 'NotFound', message: 'Template not found' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to update template' });
    }
  });

  /**
   * Delete template
   * DELETE /api/templates/:id
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      await templateService.deleteTemplate(user.id, id);

      return reply.send({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.code(404).send({ error: 'NotFound', message: 'Template not found' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to delete template' });
    }
  });

  /**
   * Get template with children hierarchy
   * GET /api/templates/:id/children
   */
  fastify.get('/:id/children', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const hierarchy = await templateService.getTemplateHierarchy(user.id, id);

      if (!hierarchy) {
        return reply.code(404).send({ error: 'NotFound', message: 'Template not found' });
      }

      return reply.send({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to get template hierarchy' });
    }
  });
};
