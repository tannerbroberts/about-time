/**
 * Lucia authentication configuration
 */

import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import { env } from './env.js';
import pg from 'pg';

// Create adapter for Lucia
// Note: NodePostgresAdapter requires pg.Pool, not postgres package
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

const adapter = new NodePostgresAdapter(pool, {
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
      // Use 'none' for cross-origin cookies (Railway subdomains)
      // Use 'lax' for same-origin (development)
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  },
  getUserAttributes: (attributes): { email: string; displayName: string | null; oauthProvider: string | null } => ({
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
