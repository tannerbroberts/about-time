import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
  const client = await pool.connect();

  try {
    console.log('Applying migration 0008_black_stellaris...');

    // Check if columns already exist
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'library_memberships'
      AND column_name IN ('last_used_at', 'usage_count');
    `;

    const existing = await client.query(checkQuery);
    const existingColumns = existing.rows.map(row => row.column_name);

    console.log('Existing columns:', existingColumns);

    if (!existingColumns.includes('last_used_at')) {
      console.log('Adding last_used_at column...');
      await client.query('ALTER TABLE library_memberships ADD COLUMN last_used_at timestamp with time zone');
    }

    if (!existingColumns.includes('usage_count')) {
      console.log('Adding usage_count column...');
      await client.query('ALTER TABLE library_memberships ADD COLUMN usage_count integer DEFAULT 0 NOT NULL');
    }

    console.log('✓ Migration applied successfully!');

    // Verify columns were added
    const verify = await client.query(checkQuery);
    console.log('Verification - columns present:', verify.rows.map(row => row.column_name));

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
