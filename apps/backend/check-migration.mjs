import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkMigration() {
  const client = await pool.connect();

  try {
    console.log('Checking migration status...');

    // Check if columns exist
    const checkQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'library_memberships'
      AND column_name IN ('last_used_at', 'usage_count')
      ORDER BY column_name;
    `;

    const result = await client.query(checkQuery);

    if (result.rows.length === 0) {
      console.log('❌ Migration NOT applied - columns do not exist');
      console.log('Columns needed: last_used_at, usage_count');
    } else {
      console.log('✅ Migration appears to be applied!');
      console.log('\nColumns found:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}`);
        console.log(`    Type: ${row.data_type}`);
        console.log(`    Nullable: ${row.is_nullable}`);
        console.log(`    Default: ${row.column_default || 'none'}`);
      });
    }

    // Check drizzle migrations table
    console.log('\n\nChecking drizzle migrations table...');
    const migrationsQuery = `
      SELECT * FROM __drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 5;
    `;

    try {
      const migrations = await client.query(migrationsQuery);
      console.log(`\nLast ${migrations.rows.length} migrations:`);
      migrations.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. ${row.hash} - Created: ${row.created_at}`);
      });
    } catch (err) {
      console.log('Could not query migrations table:', err.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMigration();
