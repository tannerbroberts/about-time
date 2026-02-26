/**
 * Schedule routes for lane assignments and nutrition goals
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ScheduleService } from '../services/schedule.service.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const scheduleService = new ScheduleService();

// Validation schemas
const lanesQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const setLaneSchema = z.object({
  laneTemplateId: z.string(),
});

const updateGoalsSchema = z.object({
  calories: z.number().int().positive(),
  proteinG: z.number().int().positive(),
  carbsG: z.number().int().positive(),
  fatsG: z.number().int().positive(),
});

export const scheduleRoutes: FastifyPluginAsync = async (fastify) => {
  // All schedule routes require authentication
  fastify.addHook('preHandler', requireAuth);

  /**
   * Get schedule lanes for date range
   * GET /api/schedule/lanes?startDate=2026-02-01&endDate=2026-02-28
   */
  fastify.get('/lanes', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { startDate, endDate } = lanesQuerySchema.parse(request.query);

      const lanes = await scheduleService.getLanes(user.id, startDate, endDate);

      return reply.send({
        success: true,
        data: lanes,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to get lanes' });
    }
  });

  /**
   * Set lane for a specific date
   * PUT /api/schedule/lanes/:dateKey
   */
  fastify.put('/lanes/:dateKey', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { dateKey } = request.params as { dateKey: string };
      const { laneTemplateId } = setLaneSchema.parse(request.body);

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return reply.code(400).send({ error: 'ValidationError', message: 'Invalid date format' });
      }

      await scheduleService.setLane(user.id, dateKey, laneTemplateId);

      return reply.send({
        success: true,
        message: 'Lane assignment updated',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to set lane' });
    }
  });

  /**
   * Remove lane assignment
   * DELETE /api/schedule/lanes/:dateKey
   */
  fastify.delete('/lanes/:dateKey', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { dateKey } = request.params as { dateKey: string };

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return reply.code(400).send({ error: 'ValidationError', message: 'Invalid date format' });
      }

      await scheduleService.removeLane(user.id, dateKey);

      return reply.send({
        success: true,
        message: 'Lane assignment removed',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to remove lane' });
    }
  });

  /**
   * Get daily nutrition goals
   * GET /api/schedule/goals
   */
  fastify.get('/goals', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;

      const goals = await scheduleService.getGoals(user.id);

      if (!goals) {
        return reply.code(404).send({ error: 'NotFound', message: 'No goals set' });
      }

      return reply.send({
        success: true,
        data: goals,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to get goals' });
    }
  });

  /**
   * Update daily nutrition goals
   * PUT /api/schedule/goals
   */
  fastify.put('/goals', async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const goals = updateGoalsSchema.parse(request.body);

      await scheduleService.updateGoals(user.id, goals);

      return reply.send({
        success: true,
        message: 'Goals updated',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Failed to update goals' });
    }
  });
};
