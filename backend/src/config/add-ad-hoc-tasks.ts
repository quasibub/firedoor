import pool from './database';

async function addAdHocTasks() {
  try {
    console.log('Adding ad-hoc tasks support (nullable inspection_id)...');
    await pool.query(`
      ALTER TABLE tasks ALTER COLUMN inspection_id DROP NOT NULL;
    `);
    console.log('Ad-hoc tasks migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addAdHocTasks();
