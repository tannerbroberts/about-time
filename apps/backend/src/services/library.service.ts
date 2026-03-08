/**
 * Library service for CRUD operations
 */

import crypto from 'crypto';

import { db } from '../db/client.js';
import { libraries, libraryMemberships, templates, type NewLibrary, type NewLibraryMembership } from '../db/schema.js';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import type { CreateLibraryDTO, UpdateLibraryDTO, AddTemplateToLibraryDTO } from '@about-time/types/library';
import type { Template } from '@tannerbroberts/about-time-core';

export class LibraryService {
  /**
   * Get all libraries for a user
   */
  async getLibraries(userId: string): Promise<Array<{
    id: string;
    name: string;
    description: string | null;
    laneTemplateId: string | null;
    ownerId: string;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
    templateCount: number;
  }>> {
    const results = await db.query.libraries.findMany({
      where: eq(libraries.ownerId, userId),
      orderBy: desc(libraries.updatedAt),
    });

    return results;
  }

  /**
   * Get single library by ID
   */
  async getLibraryById(userId: string, libraryId: string): Promise<{
    id: string;
    name: string;
    description: string | null;
    laneTemplateId: string | null;
    ownerId: string;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
    templateCount: number;
  } | null> {
    const result = await db.query.libraries.findFirst({
      where: and(
        eq(libraries.id, libraryId),
        eq(libraries.ownerId, userId)
      ),
    });

    return result || null;
  }

  /**
   * Create new library
   */
  async createLibrary(userId: string, data: CreateLibraryDTO): Promise<{
    id: string;
    name: string;
    description: string | null;
    laneTemplateId: string | null;
    ownerId: string;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
    templateCount: number;
  }> {
    const newLibrary: NewLibrary = {
      name: data.name,
      description: data.description || null,
      laneTemplateId: data.laneTemplateId || null,
      ownerId: userId,
      visibility: data.visibility || 'private',
      templateCount: 0,
    };

    const [created] = await db.insert(libraries)
      .values(newLibrary)
      .returning();

    return created;
  }

  /**
   * Update library metadata
   */
  async updateLibrary(
    userId: string,
    libraryId: string,
    data: UpdateLibraryDTO
  ): Promise<{
    id: string;
    name: string;
    description: string | null;
    laneTemplateId: string | null;
    ownerId: string;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
    templateCount: number;
  } | null> {
    // First verify ownership
    const existing = await this.getLibraryById(userId, libraryId);
    if (!existing) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<NewLibrary> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.visibility !== undefined) {
      updateData.visibility = data.visibility;
    }

    const [updated] = await db.update(libraries)
      .set(updateData)
      .where(and(
        eq(libraries.id, libraryId),
        eq(libraries.ownerId, userId)
      ))
      .returning();

    return updated || null;
  }

  /**
   * Delete library
   */
  async deleteLibrary(userId: string, libraryId: string): Promise<boolean> {
    // Verify ownership before deletion
    const existing = await this.getLibraryById(userId, libraryId);
    if (!existing) {
      return false;
    }

    // Delete library (CASCADE will handle memberships)
    await db.delete(libraries)
      .where(and(
        eq(libraries.id, libraryId),
        eq(libraries.ownerId, userId)
      ));

    return true;
  }

  /**
   * Add template to library
   */
  async addTemplateToLibrary(
    userId: string,
    data: AddTemplateToLibraryDTO
  ): Promise<{
    id: string;
    libraryId: string;
    templateId: string;
    addedAt: Date;
    addedBy: string;
    notes: string | null;
    tags: string[] | null;
    order: number | null;
  }> {
    // Verify library ownership
    const library = await this.getLibraryById(userId, data.libraryId);
    if (!library) {
      throw new Error('Library not found');
    }

    // Verify template ownership
    const template = await db.query.templates.findFirst({
      where: and(
        eq(templates.id, data.templateId),
        eq(templates.userId, userId)
      ),
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Check for circular reference
    const circlePath = await this.checkCircularReference(userId, data.libraryId, data.templateId);
    if (circlePath) {
      throw new Error(`Circular reference detected: ${circlePath.join(' → ')}`);
    }

    // Create membership
    const newMembership: NewLibraryMembership = {
      libraryId: data.libraryId,
      templateId: data.templateId,
      addedBy: userId,
      notes: data.notes || null,
      tags: data.tags || null,
      order: data.order || null,
    };

    const [created] = await db.insert(libraryMemberships)
      .values(newMembership)
      .returning();

    // Increment template count
    await db.update(libraries)
      .set({
        templateCount: sql`${libraries.templateCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(libraries.id, data.libraryId));

    return created;
  }

  /**
   * Remove template from library
   */
  async removeTemplateFromLibrary(
    userId: string,
    libraryId: string,
    templateId: string
  ): Promise<boolean> {
    // Verify library ownership
    const library = await this.getLibraryById(userId, libraryId);
    if (!library) {
      return false;
    }

    // Delete membership
    const result = await db.delete(libraryMemberships)
      .where(and(
        eq(libraryMemberships.libraryId, libraryId),
        eq(libraryMemberships.templateId, templateId)
      ))
      .returning();

    if (result.length === 0) {
      return false;
    }

    // Decrement template count
    await db.update(libraries)
      .set({
        templateCount: sql`GREATEST(${libraries.templateCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(libraries.id, libraryId));

    return true;
  }

  /**
   * Get templates in a library
   */
  async getLibraryTemplates(
    userId: string,
    libraryId: string
  ): Promise<Array<{
    template: Template;
    membership: {
      id: string;
      libraryId: string;
      templateId: string;
      addedAt: Date;
      addedBy: string;
      notes: string | null;
      tags: string[] | null;
      order: number | null;
    };
  }>> {
    // Verify library ownership
    const library = await this.getLibraryById(userId, libraryId);
    if (!library) {
      throw new Error('Library not found');
    }

    // Get memberships with templates
    const results = await db
      .select({
        membership: libraryMemberships,
        template: templates,
      })
      .from(libraryMemberships)
      .innerJoin(templates, eq(libraryMemberships.templateId, templates.id))
      .where(and(
        eq(libraryMemberships.libraryId, libraryId),
        eq(templates.userId, userId)
      ))
      .orderBy(asc(libraryMemberships.order), desc(libraryMemberships.addedAt));

    return results.map(r => ({
      template: r.template.templateData,
      membership: r.membership,
    }));
  }

  /**
   * Update membership metadata
   */
  async updateLibraryMembership(
    userId: string,
    libraryId: string,
    templateId: string,
    data: {
      notes?: string;
      tags?: string[];
      order?: number;
    }
  ): Promise<{
    id: string;
    libraryId: string;
    templateId: string;
    addedAt: Date;
    addedBy: string;
    notes: string | null;
    tags: string[] | null;
    order: number | null;
  } | null> {
    // Verify library ownership
    const library = await this.getLibraryById(userId, libraryId);
    if (!library) {
      return null;
    }

    // Build update object
    const updateData: Partial<NewLibraryMembership> = {};

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }
    if (data.order !== undefined) {
      updateData.order = data.order;
    }

    const [updated] = await db.update(libraryMemberships)
      .set(updateData)
      .where(and(
        eq(libraryMemberships.libraryId, libraryId),
        eq(libraryMemberships.templateId, templateId)
      ))
      .returning();

    return updated || null;
  }

  /**
   * Track template usage - increment usage count and update last used timestamp
   * Call this when a template is added to a lane segment
   */
  async trackTemplateUsage(templateId: string): Promise<void> {
    // Update all library memberships for this template
    await db.update(libraryMemberships)
      .set({
        usageCount: sql`${libraryMemberships.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(libraryMemberships.templateId, templateId));
  }

  /**
   * Get usage statistics for a specific template across all libraries
   */
  async getTemplateUsageStats(templateId: string): Promise<{
    totalUsageCount: number;
    lastUsedAt: Date | null;
    libraryCount: number;
  }> {
    const results = await db
      .select({
        usageCount: libraryMemberships.usageCount,
        lastUsedAt: libraryMemberships.lastUsedAt,
      })
      .from(libraryMemberships)
      .where(eq(libraryMemberships.templateId, templateId));

    if (results.length === 0) {
      return {
        totalUsageCount: 0,
        lastUsedAt: null,
        libraryCount: 0,
      };
    }

    const totalUsageCount = results.reduce((sum, r) => sum + (r.usageCount || 0), 0);
    const mostRecentUse = results
      .map(r => r.lastUsedAt)
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    return {
      totalUsageCount,
      lastUsedAt: mostRecentUse,
      libraryCount: results.length,
    };
  }

  /**
   * Export library as JSON with all templates and composites
   */
  async exportLibrary(userId: string, libraryId: string): Promise<{
    version: string;
    library: {
      name: string;
      description: string | null;
      visibility: string;
    };
    templates: Array<Record<string, unknown>>;
    composites: Array<Record<string, unknown>>;
  }> {
    // Verify ownership
    const library = await this.getLibraryById(userId, libraryId);
    if (!library) {
      throw new Error('Library not found');
    }

    // Get all templates in library
    const libraryTemplates = await this.getLibraryTemplates(userId, libraryId);

    // Export format
    return {
      version: '1.0',
      library: {
        name: library.name,
        description: library.description,
        visibility: library.visibility,
      },
      templates: libraryTemplates.map(({ template, membership }) => ({
        id: template.id,
        intent: template.intent,
        templateType: template.templateType,
        estimatedDuration: template.estimatedDuration,
        templateData: template,
        membership: {
          notes: membership.notes,
          tags: membership.tags,
          order: membership.order,
        },
      })),
      composites: [], // TODO: Add composite export when needed
    };
  }

  /**
   * Import library from JSON export
   */
  async importLibrary(
    userId: string,
    importData: {
      version: string;
      library: { name: string; description?: string; visibility?: string };
      templates: Array<{ templateData: Record<string, unknown>; membership?: Record<string, unknown> }>;
    }
  ): Promise<string> {
    // Create new library
    const library = await this.createLibrary(userId, {
      name: `${importData.library.name} (imported)`,
      description: importData.library.description,
      visibility: (importData.library.visibility as 'private' | 'unlisted' | 'public') || 'private',
    });

    // Import templates
    const { TemplateService } = await import('./template.service.js');
    const templateService = new TemplateService();

    for (const templateItem of importData.templates) {
      try {
        const template = templateItem.templateData as unknown as Template;
        // Create template with new ID
        const newTemplate = { ...template, id: crypto.randomUUID() };
        await templateService.createTemplate(userId, newTemplate);

        // Add to library
        await this.addTemplateToLibrary(userId, {
          libraryId: library.id,
          templateId: newTemplate.id,
          notes: (templateItem.membership as { notes?: string })?.notes,
          tags: (templateItem.membership as { tags?: string[] })?.tags,
        });
      } catch (error) {
        // Log error but continue with other templates
        console.error('Failed to import template:', error);
      }
    }

    return library.id;
  }

  /**
   * Check if adding a template to a library would create a circular reference
   * Returns the circular path if found, null otherwise
   */
  async checkCircularReference(
    userId: string,
    libraryId: string,
    templateId: string
  ): Promise<string[] | null> {
    // Get the library to check which lane it belongs to
    const library = await this.getLibraryById(userId, libraryId);
    if (!library || !library.laneTemplateId) {
      // Global library, no circular reference possible
      return null;
    }

    // Import TemplateService to check template hierarchy
    const { TemplateService } = await import('./template.service.js');
    const templateService = new TemplateService();

    // Get the template being added
    const template = await templateService.getTemplateById(userId, templateId);
    if (!template || template.templateType !== 'lane') {
      // Not a lane template, no circular reference
      return null;
    }

    // Check if the lane template contains the library's parent lane in its hierarchy
    const visited = new Set<string>();
    const path: string[] = [templateId];

    const detectCycle = async (currentTemplateId: string): Promise<boolean> => {
      // Circular reference detected
      if (currentTemplateId === library.laneTemplateId) {
        path.push(library.laneTemplateId);
        return true;
      }

      // Already visited
      if (visited.has(currentTemplateId)) {
        return false;
      }

      visited.add(currentTemplateId);

      // Get template hierarchy
      const hierarchy = await templateService.getTemplateHierarchy(userId, currentTemplateId);
      if (!hierarchy) {
        return false;
      }

      // Check all children
      for (const child of hierarchy.children) {
        if (child.templateType === 'lane') {
          path.push(child.id);
          if (await detectCycle(child.id)) {
            return true;
          }
          path.pop();
        }
      }

      return false;
    };

    const hasCycle = await detectCycle(templateId);
    return hasCycle ? path : null;
  }

  /**
   * Check library for any existing circular references
   */
  async detectExistingCycles(userId: string, libraryId: string): Promise<string[][]> {
    const library = await this.getLibraryById(userId, libraryId);
    if (!library || !library.laneTemplateId) {
      return [];
    }

    const templates = await this.getLibraryTemplates(userId, libraryId);
    const cycles: string[][] = [];

    for (const { template } of templates) {
      if (template.templateType === 'lane') {
        const cycle = await this.checkCircularReference(userId, libraryId, template.id);
        if (cycle) {
          cycles.push(cycle);
        }
      }
    }

    return cycles;
  }
}
