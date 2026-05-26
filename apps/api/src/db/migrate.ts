import dotenv from 'dotenv';
import path from 'path';

// Load env configuration parameters from the workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lms_gamified';

async function main() {
  console.log('[INFO] Running database migrations programmatically...');
  
  const client = new pg.Client({
    connectionString,
  });

  try {
    await client.connect();
    const db = drizzle(client);

    // This runs migrations on the database matching the migrations folder
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, 'migrations'),
    });

    console.log('[OK] Migrations completed successfully!');
  } catch (error) {
    console.error('[ERROR] Error executing migrations:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
