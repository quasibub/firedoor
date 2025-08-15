import pool from './database';

async function addCompletedAtColumn() {
  try {
    console.log('🔄 Adding completed_at column to tasks table...');
    
    // Check if completed_at column already exists
    const { rows } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'completed_at'
    `);
    
    if (rows.length === 0) {
      // Add the completed_at column
      await pool.query('ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE');
      console.log('✅ Added completed_at column to tasks table');
    } else {
      console.log('ℹ️  completed_at column already exists in tasks table');
    }
    
    console.log('🎉 Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addCompletedAtColumn()
    .then(() => {
      console.log('✅ Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default addCompletedAtColumn; 