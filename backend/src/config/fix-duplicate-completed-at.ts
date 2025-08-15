import pool from './database';

async function fixDuplicateCompletedAtColumns() {
  try {
    console.log('🔄 Fixing duplicate completed_at columns...');
    
    // First, let's see what columns we have
    const { rows: allColumns } = await pool.query(`
      SELECT column_name, data_type, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      ORDER BY ordinal_position
    `);
    
    console.log('All columns in tasks table:', allColumns);
    
    // Check for completed_at columns specifically
    const { rows: completedAtColumns } = await pool.query(`
      SELECT column_name, data_type, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'completed_at'
      ORDER BY ordinal_position
    `);
    
    console.log('Found completed_at columns:', completedAtColumns);
    
    if (completedAtColumns.length > 1) {
      console.log('⚠️  Found duplicate completed_at columns. Fixing...');
      
      // Drop all completed_at columns
      for (let i = 0; i < completedAtColumns.length; i++) {
        console.log(`Dropping completed_at column ${i + 1}...`);
        try {
          await pool.query('ALTER TABLE tasks DROP COLUMN completed_at');
        } catch (error) {
          console.log(`Column ${i + 1} already dropped or doesn't exist`);
        }
      }
      
      // Add back one completed_at column
      console.log('Adding single completed_at column...');
      await pool.query('ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE');
      
      console.log('✅ Duplicate columns fixed');
    } else if (completedAtColumns.length === 1) {
      console.log('✅ Only one completed_at column found - no duplicates');
    } else {
      console.log('ℹ️  No completed_at columns found, adding one...');
      await pool.query('ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE');
    }
    
    // Verify the final state
    const { rows: finalCheck } = await pool.query(`
      SELECT column_name, data_type, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'completed_at'
    `);
    
    console.log('Final completed_at columns:', finalCheck);
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
  fixDuplicateCompletedAtColumns()
    .then(() => {
      console.log('✅ Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default fixDuplicateCompletedAtColumns; 