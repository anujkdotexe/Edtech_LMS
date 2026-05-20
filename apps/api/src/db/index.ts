import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lms_gamified';

const pool = new pg.Pool({
  connectionString,
  max: 15, // Keep within the 20-connection pool limit of Neon Free tier/local PostgreSQL container
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Timeout connection attempts after 5 seconds
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
