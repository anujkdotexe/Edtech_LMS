import dotenv from 'dotenv';
import path from 'path';

// Load env configuration parameters from the workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lms_gamified';

async function main() {
  console.log('⏳ Ensuring database exists...');
  
  // Connect to default 'postgres' database to perform the creation query
  const defaultUrl = connectionString.replace(/\/([^\/]+)$/, '/postgres');
  
  const client = new pg.Client({
    connectionString: defaultUrl,
  });

  try {
    await client.connect();
    
    // Query pg_database to check if the target database exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='lms_gamified'");
    if (res.rowCount === 0) {
      console.log("🛠️ Creating database 'lms_gamified'...");
      await client.query("CREATE DATABASE lms_gamified");
      console.log("✅ Database 'lms_gamified' created successfully!");
    } else {
      console.log("✅ Database 'lms_gamified' already exists.");
    }
  } catch (error) {
    console.error('❌ Error ensuring database exists:', error);
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
