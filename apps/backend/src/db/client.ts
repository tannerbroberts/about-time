/**
 * Database client with connection pooling
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

// Create PostgreSQL connection with pooling
const queryClient = postgres(env.DATABASE_URL, {
  max: 20, // Maximum connections per pod
});

// Create Drizzle ORM instance
export const db = drizzle(queryClient, { schema });

// Helper to close connection (for graceful shutdown)
export const closeDatabase = async (): Promise<void> => {
  await queryClient.end();
};
