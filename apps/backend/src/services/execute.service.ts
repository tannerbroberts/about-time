/**
 * Execute service for tracking daily completion state
 */

import { db } from '../db/client.js';
import { dailyState } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export class ExecuteService {
  /**
   * Get daily state for a specific date
   */
  async getDailyState(userId: string, dateKey: string): Promise<{
    completedMealIds: string[];
    skippedMealIds: string[];
    updatedAt: Date;
  } | null> {
    const state = await db.query.dailyState.findFirst({
      where: and(
        eq(dailyState.userId, userId),
        eq(dailyState.dateKey, dateKey)
      ),
    });

    if (!state) {
      return null;
    }

    return {
      completedMealIds: state.completedMealIds,
      skippedMealIds: state.skippedMealIds,
      updatedAt: state.updatedAt,
    };
  }

  /**
   * Update full daily state
   */
  async updateDailyState(
    userId: string,
    dateKey: string,
    completedMealIds: string[],
    skippedMealIds: string[]
  ): Promise<void> {
    await db
      .insert(dailyState)
      .values({
        userId,
        dateKey,
        completedMealIds,
        skippedMealIds,
      })
      .onConflictDoUpdate({
        target: [dailyState.userId, dailyState.dateKey],
        set: {
          completedMealIds,
          skippedMealIds,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Mark a meal as completed
   */
  async completeMeal(userId: string, dateKey: string, mealId: string): Promise<void> {
    const state = await this.getDailyState(userId, dateKey);

    const completedMealIds = state?.completedMealIds || [];
    const skippedMealIds = (state?.skippedMealIds || []).filter(id => id !== mealId);

    if (!completedMealIds.includes(mealId)) {
      completedMealIds.push(mealId);
    }

    await this.updateDailyState(userId, dateKey, completedMealIds, skippedMealIds);
  }

  /**
   * Mark a meal as skipped
   */
  async skipMeal(userId: string, dateKey: string, mealId: string): Promise<void> {
    const state = await this.getDailyState(userId, dateKey);

    const skippedMealIds = state?.skippedMealIds || [];
    const completedMealIds = (state?.completedMealIds || []).filter(id => id !== mealId);

    if (!skippedMealIds.includes(mealId)) {
      skippedMealIds.push(mealId);
    }

    await this.updateDailyState(userId, dateKey, completedMealIds, skippedMealIds);
  }

  /**
   * Remove a meal from both completed and skipped lists
   */
  async unmarkMeal(userId: string, dateKey: string, mealId: string): Promise<void> {
    const state = await this.getDailyState(userId, dateKey);

    if (!state) {
      return;
    }

    const completedMealIds = state.completedMealIds.filter(id => id !== mealId);
    const skippedMealIds = state.skippedMealIds.filter(id => id !== mealId);

    await this.updateDailyState(userId, dateKey, completedMealIds, skippedMealIds);
  }
}
