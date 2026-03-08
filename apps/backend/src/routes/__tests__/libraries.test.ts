/**
 * Integration tests for library API endpoints
 *
 * To run these tests, install test dependencies:
 * npm install --save-dev vitest @vitest/ui
 *
 * Add to package.json scripts:
 * "test": "vitest",
 * "test:ui": "vitest --ui"
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { db } from '../../db/client.js';
import { users, templates, libraries, libraryMemberships } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  passwordHash: 'test-hash',
};

const testTemplate = {
  id: 'test-template-1',
  intent: 'Test Busy Template',
  templateType: 'busy' as const,
  estimatedDuration: 3600000,
  willProduce: { calories: 500 },
  willConsume: { time: 60 },
};

const testLaneTemplate = {
  id: 'test-lane-1',
  intent: 'Test Lane Template',
  templateType: 'lane' as const,
  estimatedDuration: 7200000,
  segments: [],
  willProduce: {},
  willConsume: {},
};

describe('Library API Integration Tests', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    // Setup: Create test user
    await db.insert(users).values(testUser);
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    await db.delete(libraryMemberships).where(eq(libraryMemberships.addedBy, testUser.id));
    await db.delete(libraries).where(eq(libraries.ownerId, testUser.id));
    await db.delete(templates).where(eq(templates.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  beforeEach(async () => {
    // Clean up between tests
    await db.delete(libraryMemberships).where(eq(libraryMemberships.addedBy, testUser.id));
    await db.delete(libraries).where(eq(libraries.ownerId, testUser.id));
    await db.delete(templates).where(eq(templates.userId, testUser.id));
  });

  describe('POST /api/libraries - Create library manually', () => {
    it('should create a new library', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
          description: 'A test library',
          visibility: 'private',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Test Library');
      expect(body.data.ownerId).toBe(testUser.id);
    });

    it('should reject library creation without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        payload: {
          name: 'Test Library',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          description: 'Missing name',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/templates - Auto-create library for lane template', () => {
    it('should auto-create library when creating lane template', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/templates',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          template: testLaneTemplate,
        },
      });

      expect(response.statusCode).toBe(201);

      // Check that library was created
      const librariesResponse = await app.inject({
        method: 'GET',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const libraries = JSON.parse(librariesResponse.body);
      expect(libraries.data.some((lib: { name: string }) =>
        lib.name.includes(testLaneTemplate.intent)
      )).toBe(true);
    });
  });

  describe('GET /api/libraries - List libraries', () => {
    it('should return empty list for new user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
    });

    it('should return user libraries', async () => {
      // Create a library first
      await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Library 1',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.length).toBe(1);
      expect(body.data[0].name).toBe('Library 1');
    });
  });

  describe('GET /api/libraries/:id - Get library details', () => {
    it('should return library details', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
          description: 'Test description',
        },
      });

      const library = JSON.parse(createResponse.body).data;

      const response = await app.inject({
        method: 'GET',
        url: `/api/libraries/${library.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.name).toBe('Test Library');
      expect(body.data.description).toBe('Test description');
    });

    it('should return 404 for non-existent library', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/libraries/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/libraries/:id/templates - Add template to library', () => {
    it('should add template to library', async () => {
      // Create template
      await app.inject({
        method: 'POST',
        url: '/api/templates',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          template: testTemplate,
        },
      });

      // Create library
      const libraryResponse = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
        },
      });

      const library = JSON.parse(libraryResponse.body).data;

      // Add template to library
      const response = await app.inject({
        method: 'POST',
        url: `/api/libraries/${library.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          templateId: testTemplate.id,
          notes: 'Test notes',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.templateId).toBe(testTemplate.id);
      expect(body.data.notes).toBe('Test notes');
    });

    it('should increment library template count', async () => {
      // Create template and library
      await app.inject({
        method: 'POST',
        url: '/api/templates',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          template: testTemplate,
        },
      });

      const libraryResponse = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
        },
      });

      const library = JSON.parse(libraryResponse.body).data;

      // Add template
      await app.inject({
        method: 'POST',
        url: `/api/libraries/${library.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          templateId: testTemplate.id,
        },
      });

      // Check template count
      const updatedLibrary = await app.inject({
        method: 'GET',
        url: `/api/libraries/${library.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const body = JSON.parse(updatedLibrary.body);
      expect(body.data.templateCount).toBe(1);
    });
  });

  describe('DELETE /api/libraries/:id/templates/:templateId - Remove template from library', () => {
    it('should remove template from library', async () => {
      // Setup: Create template, library, and membership
      await app.inject({
        method: 'POST',
        url: '/api/templates',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          template: testTemplate,
        },
      });

      const libraryResponse = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
        },
      });

      const library = JSON.parse(libraryResponse.body).data;

      await app.inject({
        method: 'POST',
        url: `/api/libraries/${library.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          templateId: testTemplate.id,
        },
      });

      // Remove template
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/libraries/${library.id}/templates/${testTemplate.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should decrement library template count', async () => {
      // Setup
      await app.inject({
        method: 'POST',
        url: '/api/templates',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          template: testTemplate,
        },
      });

      const libraryResponse = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
        },
      });

      const library = JSON.parse(libraryResponse.body).data;

      await app.inject({
        method: 'POST',
        url: `/api/libraries/${library.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          templateId: testTemplate.id,
        },
      });

      // Remove
      await app.inject({
        method: 'DELETE',
        url: `/api/libraries/${library.id}/templates/${testTemplate.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      // Check count
      const updatedLibrary = await app.inject({
        method: 'GET',
        url: `/api/libraries/${library.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const body = JSON.parse(updatedLibrary.body);
      expect(body.data.templateCount).toBe(0);
    });
  });

  describe('Template in multiple libraries', () => {
    it('should allow template in multiple libraries', async () => {
      // Create template
      await app.inject({
        method: 'POST',
        url: '/api/templates',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          template: testTemplate,
        },
      });

      // Create two libraries
      const lib1Response = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Library 1',
        },
      });

      const lib2Response = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Library 2',
        },
      });

      const lib1 = JSON.parse(lib1Response.body).data;
      const lib2 = JSON.parse(lib2Response.body).data;

      // Add template to both libraries
      const add1 = await app.inject({
        method: 'POST',
        url: `/api/libraries/${lib1.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          templateId: testTemplate.id,
        },
      });

      const add2 = await app.inject({
        method: 'POST',
        url: `/api/libraries/${lib2.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          templateId: testTemplate.id,
        },
      });

      expect(add1.statusCode).toBe(201);
      expect(add2.statusCode).toBe(201);

      // Verify both libraries have the template
      const lib1Templates = await app.inject({
        method: 'GET',
        url: `/api/libraries/${lib1.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const lib2Templates = await app.inject({
        method: 'GET',
        url: `/api/libraries/${lib2.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const templates1 = JSON.parse(lib1Templates.body).data;
      const templates2 = JSON.parse(lib2Templates.body).data;

      expect(templates1.length).toBe(1);
      expect(templates2.length).toBe(1);
      expect(templates1[0].template.id).toBe(testTemplate.id);
      expect(templates2[0].template.id).toBe(testTemplate.id);
    });
  });

  describe('DELETE /api/libraries/:id - Delete library cascades', () => {
    it('should delete library and its memberships', async () => {
      // Setup
      await app.inject({
        method: 'POST',
        url: '/api/templates',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          template: testTemplate,
        },
      });

      const libraryResponse = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
        },
      });

      const library = JSON.parse(libraryResponse.body).data;

      await app.inject({
        method: 'POST',
        url: `/api/libraries/${library.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          templateId: testTemplate.id,
        },
      });

      // Delete library
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/libraries/${library.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify library no longer exists
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/libraries/${library.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(getResponse.statusCode).toBe(404);

      // Verify template still exists
      const templateResponse = await app.inject({
        method: 'GET',
        url: `/api/templates/${testTemplate.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(templateResponse.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/templates/:id - Delete template removes from libraries', () => {
    it('should remove template from all libraries when deleted', async () => {
      // Setup
      await app.inject({
        method: 'POST',
        url: '/api/templates',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          template: testTemplate,
        },
      });

      const libraryResponse = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
        },
      });

      const library = JSON.parse(libraryResponse.body).data;

      await app.inject({
        method: 'POST',
        url: `/api/libraries/${library.id}/templates`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          templateId: testTemplate.id,
        },
      });

      // Delete template
      await app.inject({
        method: 'DELETE',
        url: `/api/templates/${testTemplate.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      // Verify library template count decreased
      const updatedLibrary = await app.inject({
        method: 'GET',
        url: `/api/libraries/${library.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const body = JSON.parse(updatedLibrary.body);
      expect(body.data.templateCount).toBe(0);
    });
  });

  describe('Permission checks', () => {
    const otherUser = {
      id: 'other-user-id',
      email: 'other@example.com',
      passwordHash: 'other-hash',
    };
    let otherUserToken: string;

    beforeAll(async () => {
      await db.insert(users).values(otherUser);
      // Generate auth token for other user
    });

    afterAll(async () => {
      await db.delete(users).where(eq(users.id, otherUser.id));
    });

    it('should not allow accessing other user libraries', async () => {
      // Create library as test user
      const libraryResponse = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
        },
      });

      const library = JSON.parse(libraryResponse.body).data;

      // Try to access as other user
      const response = await app.inject({
        method: 'GET',
        url: `/api/libraries/${library.id}`,
        headers: {
          authorization: `Bearer ${otherUserToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should not allow modifying other user libraries', async () => {
      // Create library as test user
      const libraryResponse = await app.inject({
        method: 'POST',
        url: '/api/libraries',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Library',
        },
      });

      const library = JSON.parse(libraryResponse.body).data;

      // Try to delete as other user
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/libraries/${library.id}`,
        headers: {
          authorization: `Bearer ${otherUserToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
