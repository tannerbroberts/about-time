/**
 * Template variables API routes (confidence bounds)
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { TemplateVariableService } from '../services/templateVariable.service.js';

const templateVariableService = new TemplateVariableService();

// Validation schemas
const GetVariablesParamsSchema = z.object({
  templateId: z.string().min(1),
});

const GetVariablesBatchSchema = z.object({
  templateIds: z.array(z.string().min(1)).min(1).max(100),
});

const UpsertVariableBodySchema = z.object({
  variableName: z.string().min(1).max(255),
  variableType: z.enum(['produce', 'consume']),
  nominalValue: z.number(),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional(),
});

const BatchUpsertVariablesBodySchema = z.object({
  variables: z.array(UpsertVariableBodySchema).min(1).max(100),
});

const DeleteVariableParamsSchema = z.object({
  templateId: z.string().min(1),
  variableName: z.string().min(1),
  variableType: z.enum(['produce', 'consume']),
});

export async function templateVariablesRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/template-variables/:templateId
  // Get all variables for a template
  fastify.get(
    '/:templateId',
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { templateId } = GetVariablesParamsSchema.parse(request.params);
        const { user } = request as AuthenticatedRequest;
        const userId = user.id;

        const variables = await templateVariableService.getTemplateVariables(userId, templateId);

        return reply.code(200).send({ success: true, variables });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({ success: false, error: 'Template not found' });
        }
        request.log.error(error);
        return reply.code(500).send({ success: false, error: 'Internal server error' });
      }
    },
  );

  // POST /api/template-variables/batch
  // Get variables for multiple templates
  fastify.post(
    '/batch',
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { templateIds } = GetVariablesBatchSchema.parse(request.body);
        const { user } = request as AuthenticatedRequest;
        const userId = user.id;

        const variablesMap = await templateVariableService.getTemplateVariablesBatch(userId, templateIds);

        // Convert Map to object for JSON serialization
        const result: Record<string, unknown[]> = {};
        variablesMap.forEach((vars, templateId) => {
          result[templateId] = vars;
        });

        return reply.code(200).send({ success: true, variables: result });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ success: false, error: 'Internal server error' });
      }
    },
  );

  // PUT /api/template-variables/:templateId
  // Upsert a single variable
  fastify.put(
    '/:templateId',
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { templateId } = request.params as z.infer<typeof GetVariablesParamsSchema>;
        const body = request.body as z.infer<typeof UpsertVariableBodySchema>;
        const { user } = request as AuthenticatedRequest;
        const userId = user.id;

        const variable = await templateVariableService.upsertTemplateVariable(userId, templateId, body);

        return reply.code(200).send({ success: true, variable });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({ success: false, error: 'Template not found' });
        }
        request.log.error(error);
        return reply.code(500).send({ success: false, error: 'Internal server error' });
      }
    },
  );

  // POST /api/template-variables/:templateId/batch
  // Batch upsert variables
  fastify.post(
    '/:templateId/batch',
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { templateId } = GetVariablesParamsSchema.parse(request.params);
        const { variables } = BatchUpsertVariablesBodySchema.parse(request.body);
        const { user } = request as AuthenticatedRequest;
        const userId = user.id;

        const result = await templateVariableService.batchUpsertTemplateVariables(userId, templateId, variables);

        return reply.code(200).send({ success: true, variables: result });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({ success: false, error: 'Template not found' });
        }
        request.log.error(error);
        return reply.code(500).send({ success: false, error: 'Internal server error' });
      }
    },
  );

  // DELETE /api/template-variables/:templateId/:variableType/:variableName
  // Delete a variable
  fastify.delete(
    '/:templateId/:variableType/:variableName',
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { templateId, variableName, variableType } = DeleteVariableParamsSchema.parse(request.params);
        const { user } = request as AuthenticatedRequest;
        const userId = user.id;

        await templateVariableService.deleteTemplateVariable(userId, templateId, variableName, variableType);

        return reply.code(200).send({ success: true });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({ success: false, error: 'Template not found' });
        }
        request.log.error(error);
        return reply.code(500).send({ success: false, error: 'Internal server error' });
      }
    },
  );
}
