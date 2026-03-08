/**
 * Service for managing template variables with confidence bounds
 */

import { and, eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import type { NewTemplateVariable, TemplateVariable } from '../db/schema.js';
import { templateVariables, templates } from '../db/schema.js';

export class TemplateVariableService {
  /**
   * Get all variables for a specific template
   */
  async getTemplateVariables(userId: string, templateId: string): Promise<TemplateVariable[]> {
    // Verify template belongs to user
    const template = await db.query.templates.findFirst({
      where: and(eq(templates.id, templateId), eq(templates.userId, userId)),
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    return await db.query.templateVariables.findMany({
      where: eq(templateVariables.templateId, templateId),
    });
  }

  /**
   * Get variables for multiple templates (batch fetch)
   */
  async getTemplateVariablesBatch(
    userId: string,
    templateIds: string[],
  ): Promise<Map<string, TemplateVariable[]>> {
    if (templateIds.length === 0) {
      return new Map();
    }

    // Verify all templates belong to user
    const userTemplates = await db.query.templates.findMany({
      where: eq(templates.userId, userId),
      columns: { id: true },
    });

    const userTemplateIds = new Set(userTemplates.map((t: { id: string }) => t.id));
    const authorizedTemplateIds = templateIds.filter((id) => userTemplateIds.has(id));

    if (authorizedTemplateIds.length === 0) {
      return new Map();
    }

    // Fetch all variables for authorized templates
    const allVariables = await db
      .select()
      .from(templateVariables)
      .where(eq(templateVariables.templateId, authorizedTemplateIds[0]));

    // Group by template ID
    const result = new Map<string, TemplateVariable[]>();
    for (const variable of allVariables) {
      if (!result.has(variable.templateId)) {
        result.set(variable.templateId, []);
      }
      result.get(variable.templateId)!.push(variable);
    }

    return result;
  }

  /**
   * Upsert (create or update) a template variable
   */
  async upsertTemplateVariable(
    userId: string,
    templateId: string,
    data: {
      variableName: string;
      variableType: 'produce' | 'consume';
      nominalValue: number;
      lowerBound?: number;
      upperBound?: number;
    },
  ): Promise<TemplateVariable> {
    // Verify template belongs to user
    const template = await db.query.templates.findFirst({
      where: and(eq(templates.id, templateId), eq(templates.userId, userId)),
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    // Check if variable already exists
    const existing = await db.query.templateVariables.findFirst({
      where: and(
        eq(templateVariables.templateId, templateId),
        eq(templateVariables.variableName, data.variableName),
        eq(templateVariables.variableType, data.variableType),
      ),
    });

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(templateVariables)
        .set({
          nominalValue: data.nominalValue,
          lowerBound: data.lowerBound,
          upperBound: data.upperBound,
          updatedAt: new Date(),
        })
        .where(eq(templateVariables.id, existing.id))
        .returning();

      return updated;
    }

    // Create new
    const newVariable: NewTemplateVariable = {
      templateId,
      variableName: data.variableName,
      variableType: data.variableType,
      nominalValue: data.nominalValue,
      lowerBound: data.lowerBound,
      upperBound: data.upperBound,
    };

    const [created] = await db.insert(templateVariables).values(newVariable).returning();
    return created;
  }

  /**
   * Batch upsert template variables
   */
  async batchUpsertTemplateVariables(
    userId: string,
    templateId: string,
    variables: Array<{
      variableName: string;
      variableType: 'produce' | 'consume';
      nominalValue: number;
      lowerBound?: number;
      upperBound?: number;
    }>,
  ): Promise<TemplateVariable[]> {
    // Verify template belongs to user
    const template = await db.query.templates.findFirst({
      where: and(eq(templates.id, templateId), eq(templates.userId, userId)),
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    const results: TemplateVariable[] = [];

    for (const variable of variables) {
      const result = await this.upsertTemplateVariable(userId, templateId, variable);
      results.push(result);
    }

    return results;
  }

  /**
   * Delete a template variable
   */
  async deleteTemplateVariable(
    userId: string,
    templateId: string,
    variableName: string,
    variableType: 'produce' | 'consume',
  ): Promise<void> {
    // Verify template belongs to user
    const template = await db.query.templates.findFirst({
      where: and(eq(templates.id, templateId), eq(templates.userId, userId)),
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    await db
      .delete(templateVariables)
      .where(
        and(
          eq(templateVariables.templateId, templateId),
          eq(templateVariables.variableName, variableName),
          eq(templateVariables.variableType, variableType),
        ),
      );
  }
}
