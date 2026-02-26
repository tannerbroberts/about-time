/**
 * Template service for CRUD operations
 */

import { db } from '../db/client.js';
import { templates, templateRelationships, type NewTemplate, type NewTemplateRelationship } from '../db/schema.js';
import { eq, and, desc, asc, ilike, or, sql } from 'drizzle-orm';
import type { Template, TemplateMap, LaneTemplate, BusyTemplate } from '@tannerbroberts/about-time-core';

export class TemplateService {
  /**
   * Create a new template
   */
  async createTemplate(userId: string, template: Template): Promise<Template> {
    // Extract relationships from template
    const relationships = this.extractRelationships(template);

    // Insert template
    const [dbTemplate] = await db.insert(templates).values({
      id: template.id,
      userId,
      templateData: template,
      templateType: template.type,
      intent: template.intent,
      estimatedDuration: template.estimatedDuration,
    }).returning();

    // Insert relationships if any
    if (relationships.length > 0) {
      await db.insert(templateRelationships).values(relationships);
    }

    return dbTemplate.templateData;
  }

  /**
   * Get template by ID
   */
  async getTemplateById(userId: string, templateId: string): Promise<Template | null> {
    const result = await db.query.templates.findFirst({
      where: and(
        eq(templates.id, templateId),
        eq(templates.userId, userId)
      ),
    });

    return result?.templateData || null;
  }

  /**
   * Get all templates for a user with pagination and filtering
   */
  async getTemplates(
    userId: string,
    options: {
      offset?: number;
      limit?: number;
      templateType?: 'busy' | 'lane';
      searchIntent?: string;
      sortBy?: 'updatedAt' | 'createdAt' | 'intent';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ templates: Template[]; total: number }> {
    const {
      offset = 0,
      limit = 50,
      templateType,
      searchIntent,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = options;

    // Build where clause
    const whereConditions = [eq(templates.userId, userId)];

    if (templateType) {
      whereConditions.push(eq(templates.templateType, templateType));
    }

    if (searchIntent) {
      whereConditions.push(ilike(templates.intent, `%${searchIntent}%`));
    }

    // Build order clause
    const orderColumn = templates[sortBy];
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    // Query templates
    const results = await db.query.templates.findMany({
      where: and(...whereConditions),
      orderBy: orderDirection(orderColumn),
      limit,
      offset,
    });

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(templates)
      .where(and(...whereConditions));

    return {
      templates: results.map(r => r.templateData),
      total: count,
    };
  }

  /**
   * Update template
   */
  async updateTemplate(userId: string, template: Template): Promise<Template> {
    // First verify ownership
    const existing = await this.getTemplateById(userId, template.id);
    if (!existing) {
      throw new Error('Template not found');
    }

    // Delete existing relationships
    await db.delete(templateRelationships)
      .where(eq(templateRelationships.parentTemplateId, template.id));

    // Extract new relationships
    const relationships = this.extractRelationships(template);

    // Update template
    const [updated] = await db.update(templates)
      .set({
        templateData: template,
        templateType: template.type,
        intent: template.intent,
        estimatedDuration: template.estimatedDuration,
        updatedAt: new Date(),
      })
      .where(and(
        eq(templates.id, template.id),
        eq(templates.userId, userId)
      ))
      .returning();

    // Insert new relationships
    if (relationships.length > 0) {
      await db.insert(templateRelationships).values(relationships);
    }

    return updated.templateData;
  }

  /**
   * Delete template
   */
  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    // Verify ownership before deletion
    const existing = await this.getTemplateById(userId, templateId);
    if (!existing) {
      throw new Error('Template not found');
    }

    // Delete template (CASCADE will handle relationships)
    await db.delete(templates)
      .where(and(
        eq(templates.id, templateId),
        eq(templates.userId, userId)
      ));
  }

  /**
   * Get template with its children
   */
  async getTemplateHierarchy(userId: string, templateId: string): Promise<{
    template: Template;
    children: Template[];
    relationships: Array<{ relationshipId: string; childTemplateId: string; offset: number }>;
  } | null> {
    const template = await this.getTemplateById(userId, templateId);
    if (!template) {
      return null;
    }

    // Get relationships
    const relations = await db.query.templateRelationships.findMany({
      where: eq(templateRelationships.parentTemplateId, templateId),
    });

    // Get child templates
    const childIds = relations.map(r => r.childTemplateId);
    const children = childIds.length > 0
      ? await db.query.templates.findMany({
        where: and(
          eq(templates.userId, userId),
          or(...childIds.map(id => eq(templates.id, id)))
        ),
      })
      : [];

    return {
      template,
      children: children.map(c => c.templateData),
      relationships: relations.map(r => ({
        relationshipId: r.id,
        childTemplateId: r.childTemplateId,
        offset: r.offset,
      })),
    };
  }

  /**
   * Extract relationships from a template for storage
   */
  private extractRelationships(template: Template): NewTemplateRelationship[] {
    const relationships: NewTemplateRelationship[] = [];

    if (template.type === 'lane') {
      const laneTemplate = template as LaneTemplate;
      for (const segment of laneTemplate.segments) {
        relationships.push({
          id: segment.relationshipId,
          parentTemplateId: template.id,
          childTemplateId: segment.busy.id,
          offset: segment.offset,
        });
      }
    }

    return relationships;
  }

  /**
   * Convert TemplateMap to array
   */
  static templateMapToArray(templateMap: TemplateMap): Template[] {
    return Object.values(templateMap);
  }

  /**
   * Convert array to TemplateMap
   */
  static arrayToTemplateMap(templates: Template[]): TemplateMap {
    const map: TemplateMap = {};
    for (const template of templates) {
      map[template.id] = template;
    }
    return map;
  }
}
