/**
 * Authentication middleware for protected routes
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { lucia } from '../config/lucia.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
}

/**
 * Middleware to validate session and attach user to request
 */
export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const sessionId = request.cookies.session_id;

  if (!sessionId) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'No session cookie' });
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);

    if (!session || !user) {
      // Invalid session - clear cookie
      reply.setCookie('session_id', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 0,
      });
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid session' });
    }

    // Attach user and session to request
    // eslint-disable-next-line no-param-reassign
    (request as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
    // eslint-disable-next-line no-param-reassign
    (request as AuthenticatedRequest).session = {
      id: session.id,
      expiresAt: session.expiresAt,
    };

    // If session is close to expiring, refresh it
    if (session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      reply.setCookie(sessionCookie.name, sessionCookie.value, {
        ...sessionCookie.attributes,
        httpOnly: true,
      });
    }
  } catch (error) {
    // Session validation failed (database error, timeout, etc.)
    request.log.error({ error, sessionId }, 'Session validation error');

    // Clear the invalid cookie
    reply.setCookie('session_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 0,
    });

    // Return 401 instead of letting the error propagate as 503
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Session validation failed',
    });
  }
};
