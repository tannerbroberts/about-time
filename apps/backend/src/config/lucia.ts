/**
 * Lucia authentication configuration
 */

import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import { env } from './env.js';

// Create adapter for Lucia
// Note: We use postgres client directly for the adapter
import postgres from 'postgres';
const queryClient = postgres(env.DATABASE_URL);

const adapter = new NodePostgresAdapter(queryClient, {
  user: 'users',
  session: 'sessions',
});

// Create Lucia instance
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: 'session_id',
    expires: false, // Session cookies (expires when browser closes)
    attributes: {
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    displayName: attributes.displayName,
    oauthProvider: attributes.oauthProvider,
  }),
});

// Declare module augmentation for Lucia types
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      displayName: string | null;
      oauthProvider: string | null;
    };
  }
}
