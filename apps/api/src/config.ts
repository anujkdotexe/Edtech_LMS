import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env parameters from the monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL connection string is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  JWT_RESET_SECRET: z.string().min(32, 'JWT_RESET_SECRET must be at least 32 characters long'),
  UPLOAD_DIR: z.string().default('public/uploads'),
});

const result = serverEnvSchema.safeParse(process.env);

if (!result.success) {
  console.error('[ERROR] Invalid Backend Environment configuration:', result.error.format());
  process.exit(1);
}

export const serverEnv = result.data;
