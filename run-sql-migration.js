const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'db.dvabymxhcefstjpzvznw.supabase.co',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    const sqlPath = path.join(__dirname, 'SWAP_PROMO_MIGRATION.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
