/**
 * Environment variable configuration with validation
 */

import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file
config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3001'),

  // Session
  SESSION_SECRET: z.string().min(32),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

// Validate and export environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  // Use process.stderr.write instead of console.error (runs before logger exists)
  process.stderr.write('❌ Invalid environment variables:\n');
  process.stderr.write(`${JSON.stringify(parseResult.error.format(), null, 2)}\n`);
  process.exit(1);
}

export const env = parseResult.data;
