import pool from './database';

async function removeDueDateColumn() {
  try {
    console.log('🔄 Removing due_date column from tasks table...');
    
    // Check if due_date column exists
    const { rows } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'due_date'
    `);
    
    if (rows.length > 0) {
      // Remove the due_date column
      await pool.query('ALTER TABLE tasks DROP COLUMN due_date');
      console.log('✅ Removed due_date column from tasks table');
    } else {
      console.log('ℹ️  due_date column does not exist in tasks table');
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
  removeDueDateColumn()
    .then(() => {
      console.log('✅ Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default removeDueDateColumn; 