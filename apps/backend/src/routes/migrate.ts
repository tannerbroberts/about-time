/**
 * Migration routes for importing localStorage data
 */

import type { FastifyPluginAsync } from 'fastify';
import type { Template, TemplateMap } from '@tannerbroberts/about-time-core';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { TemplateService } from '../services/template.service.js';
import { ScheduleService } from '../services/schedule.service.js';
import { ExecuteService } from '../services/execute.service.js';

// Validation schemas
const dailyStateSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completedMealIds: z.array(z.string()),
  skippedMealIds: z.array(z.string()),
});

const migrationDataSchema = z.object({
  templates: z.record(z.any()).optional(), // TemplateMap - validated by service
  scheduleLanes: z.record(z.string()).optional(), // dateKey -> laneTemplateId
  dailyGoals: z.object({
    calories: z.number(),
    proteinG: z.number(),
    carbsG: z.number(),
    fatsG: z.number(),
  }).optional(),
  dailyStates: z.array(dailyStateSchema).optional(), // Array of daily states
});

export const migrateRoutes: FastifyPluginAsync = async (fastify) => {
  const templateService = new TemplateService();
  const scheduleService = new ScheduleService();
  const executeService = new ExecuteService();

  /**
   * POST /api/migrate
   * Batch import localStorage data
   */
  fastify.post(
    '/',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user.id;

      // Validate request body
      const validation = migrationDataSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid migration data',
          details: validation.error.errors,
        });
      }

      const data = validation.data;
      const results = {
        templates: { imported: 0, failed: 0 },
        scheduleLanes: { imported: 0, failed: 0 },
        dailyGoals: { imported: false },
        dailyStates: { imported: 0, failed: 0 },
      };

      try {
        // Import templates
        if (data.templates) {
          const templates = data.templates as TemplateMap;
          for (const template of Object.values(templates)) {
            try {
              await templateService.createTemplate(userId, template as Template);
              results.templates.imported++;
            } catch (error) {
              fastify.log.error({ error, templateId: template.id }, 'Failed to import template');
              results.templates.failed++;
            }
          }
        }

        // Import schedule lanes
        if (data.scheduleLanes) {
          for (const [dateKey, laneTemplateId] of Object.entries(data.scheduleLanes)) {
            try {
              await scheduleService.setLane(userId, dateKey, laneTemplateId);
              results.scheduleLanes.imported++;
            } catch (error) {
              fastify.log.error({ error, dateKey }, 'Failed to import schedule lane');
              results.scheduleLanes.failed++;
            }
          }
        }

        // Import daily goals
        if (data.dailyGoals) {
          try {
            await scheduleService.updateGoals(userId, data.dailyGoals);
            results.dailyGoals.imported = true;
          } catch (error) {
            fastify.log.error({ error }, 'Failed to import daily goals');
          }
        }

        // Import daily states
        if (data.dailyStates) {
          for (const state of data.dailyStates) {
            try {
              await executeService.updateDailyState(
                userId,
                state.dateKey,
                state.completedMealIds,
                state.skippedMealIds
              );
              results.dailyStates.imported++;
            } catch (error) {
              fastify.log.error({ error, dateKey: state.dateKey }, 'Failed to import daily state');
              results.dailyStates.failed++;
            }
          }
        }

        return reply.send({
          success: true,
          data: results,
        });
      } catch (error) {
        fastify.log.error({ error }, 'Migration error');
        return reply.code(500).send({
          success: false,
          error: 'Migration failed',
        });
      }
    }
  );

  /**
   * GET /api/migrate/check
   * Check if user has existing data (to determine if migration is needed)
   */
  fastify.get(
    '/check',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user.id;

      try {
        // Check if user has any templates
        const templates = await templateService.getTemplates(userId, { limit: 1 });
        const hasData = templates.templates.length > 0;

        return reply.send({
          success: true,
          data: { hasData },
        });
      } catch (error) {
        fastify.log.error({ error }, 'Check migration error');
        return reply.code(500).send({
          success: false,
          error: 'Failed to check migration status',
        });
      }
    }
  );
};
