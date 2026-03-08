/**
 * Service for managing composite unit definitions
 */

import { and, desc, eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import type { CompositeUnitDefinition, NewCompositeUnitDefinition } from '../db/schema.js';
import { compositeUnitDefinitions } from '../db/schema.js';

export class CompositeService {
  /**
   * Get all composites for a user
   */
  async getUserComposites(userId: string): Promise<CompositeUnitDefinition[]> {
    return await db.query.compositeUnitDefinitions.findMany({
      where: eq(compositeUnitDefinitions.authorId, userId),
      orderBy: [desc(compositeUnitDefinitions.updatedAt)],
    });
  }

  /**
   * Get a specific composite by ID
   */
  async getCompositeById(userId: string, compositeId: string): Promise<CompositeUnitDefinition | undefined> {
    const composite = await db.query.compositeUnitDefinitions.findFirst({
      where: and(eq(compositeUnitDefinitions.id, compositeId), eq(compositeUnitDefinitions.authorId, userId)),
    });

    if (!composite) {
      throw new Error('Composite not found or access denied');
    }

    return composite;
  }

  /**
   * Get all versions of a composite by name
   */
  async getCompositeVersions(userId: string, compositeId: string): Promise<CompositeUnitDefinition[]> {
    // First get the composite to get its name
    const composite = await this.getCompositeById(userId, compositeId);

    if (!composite) {
      throw new Error('Composite not found');
    }

    // Get all versions with the same name and author
    return await db.query.compositeUnitDefinitions.findMany({
      where: and(
        eq(compositeUnitDefinitions.name, composite.name),
        eq(compositeUnitDefinitions.authorId, userId),
      ),
      orderBy: [desc(compositeUnitDefinitions.version)],
    });
  }

  /**
   * Create a new composite definition
   */
  async createComposite(
    userId: string,
    data: {
      name: string;
      composition: Record<string, unknown>;
      changelog?: string;
    },
  ): Promise<CompositeUnitDefinition> {
    // Check if a composite with this name already exists for this user
    const existing = await db.query.compositeUnitDefinitions.findFirst({
      where: and(eq(compositeUnitDefinitions.name, data.name), eq(compositeUnitDefinitions.authorId, userId)),
      orderBy: [desc(compositeUnitDefinitions.version)],
    });

    const version = existing ? existing.version + 1 : 1;

    const newComposite: NewCompositeUnitDefinition = {
      name: data.name,
      version,
      composition: data.composition,
      authorId: userId,
      originCompositeId: null,
      linkType: 'original',
      changelog: data.changelog,
    };

    const [created] = await db.insert(compositeUnitDefinitions).values(newComposite).returning();
    return created;
  }

  /**
   * Update a composite (creates a new version)
   */
  async updateComposite(
    userId: string,
    compositeId: string,
    data: {
      composition: Record<string, unknown>;
      changelog?: string;
    },
  ): Promise<CompositeUnitDefinition> {
    // Get the existing composite to verify ownership and get name
    const existing = await this.getCompositeById(userId, compositeId);

    if (!existing) {
      throw new Error('Composite not found or access denied');
    }

    // Create a new version
    const newComposite: NewCompositeUnitDefinition = {
      name: existing.name,
      version: existing.version + 1,
      composition: data.composition,
      authorId: userId,
      originCompositeId: existing.originCompositeId,
      linkType: existing.linkType,
      changelog: data.changelog,
    };

    const [created] = await db.insert(compositeUnitDefinitions).values(newComposite).returning();
    return created;
  }

  /**
   * Delete a composite
   * Note: This will fail if the composite is referenced by templates (via foreign key)
   */
  async deleteComposite(userId: string, compositeId: string): Promise<void> {
    // Verify ownership
    const existing = await this.getCompositeById(userId, compositeId);

    if (!existing) {
      throw new Error('Composite not found or access denied');
    }

    try {
      await db.delete(compositeUnitDefinitions).where(eq(compositeUnitDefinitions.id, compositeId));
    } catch (error) {
      // Check if it's a foreign key constraint error
      const errorMessage = String(error);
      if (errorMessage.includes('foreign key') || errorMessage.includes('violates')) {
        throw new Error(
          'Cannot delete composite: it is currently used in one or more templates. Remove references first.',
        );
      }
      throw error;
    }
  }

  /**
   * Fork a composite (create a copy with new ownership)
   */
  async forkComposite(
    userId: string,
    compositeId: string,
    data: {
      changelog?: string;
    },
  ): Promise<CompositeUnitDefinition> {
    // Get the source composite (can be from any user if accessible)
    const source = await db.query.compositeUnitDefinitions.findFirst({
      where: eq(compositeUnitDefinitions.id, compositeId),
    });

    if (!source) {
      throw new Error('Source composite not found');
    }

    // Check if user already has a version of this composite name
    const existing = await db.query.compositeUnitDefinitions.findFirst({
      where: and(eq(compositeUnitDefinitions.name, source.name), eq(compositeUnitDefinitions.authorId, userId)),
      orderBy: [desc(compositeUnitDefinitions.version)],
    });

    const version = existing ? existing.version + 1 : 1;

    const forkedComposite: NewCompositeUnitDefinition = {
      name: source.name,
      version,
      composition: source.composition,
      authorId: userId,
      originCompositeId: compositeId,
      linkType: 'forked',
      changelog: data.changelog || `Forked from version ${source.version}`,
    };

    const [created] = await db.insert(compositeUnitDefinitions).values(forkedComposite).returning();
    return created;
  }

  /**
   * Create a live-linked reference to a composite
   */
  async createLiveLink(
    userId: string,
    compositeId: string,
    data: {
      changelog?: string;
    },
  ): Promise<CompositeUnitDefinition> {
    // Get the source composite
    const source = await db.query.compositeUnitDefinitions.findFirst({
      where: eq(compositeUnitDefinitions.id, compositeId),
    });

    if (!source) {
      throw new Error('Source composite not found');
    }

    // Check if user already has a version of this composite name
    const existing = await db.query.compositeUnitDefinitions.findFirst({
      where: and(eq(compositeUnitDefinitions.name, source.name), eq(compositeUnitDefinitions.authorId, userId)),
      orderBy: [desc(compositeUnitDefinitions.version)],
    });

    const version = existing ? existing.version + 1 : 1;

    const linkedComposite: NewCompositeUnitDefinition = {
      name: source.name,
      version,
      composition: source.composition,
      authorId: userId,
      originCompositeId: compositeId,
      linkType: 'live-linked',
      changelog: data.changelog || `Live-linked to version ${source.version}`,
    };

    const [created] = await db.insert(compositeUnitDefinitions).values(linkedComposite).returning();
    return created;
  }
}
