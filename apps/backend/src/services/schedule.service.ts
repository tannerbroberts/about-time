/**
 * Schedule service for managing daily lane assignments and nutrition goals
 */

import { db } from '../db/client.js';
import { scheduleLanes, dailyGoals, type NewScheduleLane, type NewDailyGoals } from '../db/schema.js';
import { eq, and, gte, lte, between } from 'drizzle-orm';

export class ScheduleService {
  /**
   * Get schedule lanes for a date range
   */
  async getLanes(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, string>> {
    const lanes = await db.query.scheduleLanes.findMany({
      where: and(
        eq(scheduleLanes.userId, userId),
        gte(scheduleLanes.dateKey, startDate),
        lte(scheduleLanes.dateKey, endDate)
      ),
    });

    const result: Record<string, string> = {};
    for (const lane of lanes) {
      result[lane.dateKey] = lane.laneTemplateId;
    }
    return result;
  }

  /**
   * Set lane for a specific date
   */
  async setLane(
    userId: string,
    dateKey: string,
    laneTemplateId: string
  ): Promise<void> {
    // Upsert: insert or update if exists
    await db
      .insert(scheduleLanes)
      .values({
        userId,
        dateKey,
        laneTemplateId,
      })
      .onConflictDoUpdate({
        target: [scheduleLanes.userId, scheduleLanes.dateKey],
        set: {
          laneTemplateId,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Remove lane assignment for a date
   */
  async removeLane(userId: string, dateKey: string): Promise<void> {
    await db
      .delete(scheduleLanes)
      .where(and(
        eq(scheduleLanes.userId, userId),
        eq(scheduleLanes.dateKey, dateKey)
      ));
  }

  /**
   * Get daily nutrition goals
   */
  async getGoals(userId: string): Promise<{
    calories: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
  } | null> {
    const goals = await db.query.dailyGoals.findFirst({
      where: eq(dailyGoals.userId, userId),
    });

    if (!goals) {
      return null;
    }

    return {
      calories: goals.calories,
      proteinG: goals.proteinG,
      carbsG: goals.carbsG,
      fatsG: goals.fatsG,
    };
  }

  /**
   * Update daily nutrition goals
   */
  async updateGoals(
    userId: string,
    goals: {
      calories: number;
      proteinG: number;
      carbsG: number;
      fatsG: number;
    }
  ): Promise<void> {
    await db
      .insert(dailyGoals)
      .values({
        userId,
        calories: goals.calories,
        proteinG: goals.proteinG,
        carbsG: goals.carbsG,
        fatsG: goals.fatsG,
      })
      .onConflictDoUpdate({
        target: dailyGoals.userId,
        set: {
          calories: goals.calories,
          proteinG: goals.proteinG,
          carbsG: goals.carbsG,
          fatsG: goals.fatsG,
          updatedAt: new Date(),
        },
      });
  }
}
