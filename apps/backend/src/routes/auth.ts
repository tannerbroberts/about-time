/**
 * Authentication routes (register, login, logout)
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { lucia } from '../config/lucia.js';
import { eq } from 'drizzle-orm';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

// Simple password hashing (replace with bcrypt in production)
const hashPassword = async (password: string): Promise<string> => {
  // For now, use a simple hash (REPLACE WITH BCRYPT IN PRODUCTION)
  const { createHash } = await import('crypto');
  return createHash('sha256').update(password).digest('hex');
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register new user
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, displayName } = registerSchema.parse(request.body);

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        return reply.code(400).send({ error: 'BadRequest', message: 'User already exists' });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const [newUser] = await db.insert(users).values({
        email,
        passwordHash,
        displayName: displayName || null,
        oauthProvider: null,
        oauthId: null,
      }).returning();

      // Create session
      const session = await lucia.createSession(newUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      reply.setCookie(sessionCookie.name, sessionCookie.value, {
        ...sessionCookie.attributes,
        httpOnly: true,
      });

      return reply.code(201).send({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Registration failed' });
    }
  });

  // Login existing user
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user || !user.passwordHash) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
      }

      // Create session
      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      reply.setCookie(sessionCookie.name, sessionCookie.value, {
        ...sessionCookie.attributes,
        httpOnly: true,
      });

      return reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'ValidationError', message: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'InternalServerError', message: 'Login failed' });
    }
  });

  // Logout user
  fastify.post('/logout', { preHandler: requireAuth }, async (request, reply) => {
    const { session } = request as AuthenticatedRequest;

    await lucia.invalidateSession(session.id);

    reply.setCookie('session_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 0,
    });

    return reply.send({ success: true });
  });

  // Get current user
  fastify.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;

    return reply.send({
      success: true,
      user,
    });
  });
};
