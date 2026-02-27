/**
 * Public template browsing routes (no authentication required)
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TemplateService } from '../services/template.service.js';

const templateService = new TemplateService();

const listPublicTemplatesSchema = z.object({
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  templateType: z.enum(['busy', 'lane']).optional(),
  searchIntent: z.string().optional(),
  sortBy: z.enum(['publishedAt', 'intent']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const publicTemplateRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Browse public templates (no auth required)
   * GET /api/public-templates?offset=0&limit=50&templateType=lane&searchIntent=breakfast
   */
  fastify.get('/', async (request, reply) => {
    try {
      const query = listPublicTemplatesSchema.parse(request.query);

      const result = await templateService.getPublicTemplates(query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to list public templates' });
    }
  });
};
