/**
 * Execute routes for daily completion tracking
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ExecuteService } from '../services/execute.service.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const executeService = new ExecuteService();

// Validation schemas
const updateDailyStateSchema = z.object({
  completedMealIds: z.array(z.string()),
  skippedMealIds: z.array(z.string()),
});

const mealActionSchema = z.object({
  mealId: z.string(),
});

export const executeRoutes: FastifyPluginAsync = async (fastify) => {
  // All execute routes require authentication
  fastify.addHook('preHandler', requireAuth);

  /**
   * Get daily state for a specific date
   * GET /api/execute/daily-state/:dateKey
   */
  fastify.get('/daily-state/:dateKey', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { dateKey } = request.params as { dateKey: string };

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return reply.code(400).send({ error: 'ValidationError', message: 'Invalid date format' });
      }

      const state = await executeService.getDailyState(user.id, dateKey);

      if (!state) {
        // Return empty state if none exists
        return reply.send({
          success: true,
          data: {
            dateKey,
            completedMealIds: [],
            skippedMealIds: [],
            updatedAt: new Date(),
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          dateKey,
          ...state,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to get daily state' });
    }
  });

  /**
   * Update full daily state
   * PUT /api/execute/daily-state/:dateKey
   */
  fastify.put('/daily-state/:dateKey', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { dateKey } = request.params as { dateKey: string };
      const { completedMealIds, skippedMealIds } = updateDailyStateSchema.parse(request.body);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return reply.code(400).send({ error: 'ValidationError', message: 'Invalid date format' });
      }

      await executeService.updateDailyState(user.id, dateKey, completedMealIds, skippedMealIds);

      return reply.send({
        success: true,
        message: 'Daily state updated',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to update daily state' });
    }
  });

  /**
   * Mark meal as completed
   * PATCH /api/execute/daily-state/:dateKey/complete
   */
  fastify.patch('/daily-state/:dateKey/complete', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { dateKey } = request.params as { dateKey: string };
      const { mealId } = mealActionSchema.parse(request.body);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return reply.code(400).send({ error: 'ValidationError', message: 'Invalid date format' });
      }

      await executeService.completeMeal(user.id, dateKey, mealId);

      return reply.send({
        success: true,
        message: 'Meal marked as completed',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to complete meal' });
    }
  });

  /**
   * Mark meal as skipped
   * PATCH /api/execute/daily-state/:dateKey/skip
   */
  fastify.patch('/daily-state/:dateKey/skip', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { dateKey } = request.params as { dateKey: string };
      const { mealId } = mealActionSchema.parse(request.body);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return reply.code(400).send({ error: 'ValidationError', message: 'Invalid date format' });
      }

      await executeService.skipMeal(user.id, dateKey, mealId);

      return reply.send({
        success: true,
        message: 'Meal marked as skipped',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to skip meal' });
    }
  });

  /**
   * Unmark meal (remove from both completed and skipped)
   * PATCH /api/execute/daily-state/:dateKey/unmark
   */
  fastify.patch('/daily-state/:dateKey/unmark', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { dateKey } = request.params as { dateKey: string };
      const { mealId } = mealActionSchema.parse(request.body);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return reply.code(400).send({ error: 'ValidationError', message: 'Invalid date format' });
      }

      await executeService.unmarkMeal(user.id, dateKey, mealId);

      return reply.send({
        success: true,
        message: 'Meal unmarked',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to unmark meal' });
    }
  });
};
