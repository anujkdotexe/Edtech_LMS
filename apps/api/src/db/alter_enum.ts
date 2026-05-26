import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lms_gamified';

async function main() {
  console.log('[INFO] Connecting to database...');
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  try {
    console.log('[INFO] Altering order_status enum to add REFUNDED...');
    await client.query(`ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'REFUNDED'`);
    console.log('[OK] order_status enum altered successfully.');
  } catch (error) {
    console.error('[ERROR] Failed to alter enum:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
