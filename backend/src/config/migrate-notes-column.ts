import pool from './database';

async function addNotesColumn() {
  try {
    console.log('🔄 Adding notes column to tasks table...');
    
    // Check if notes column already exists
    const { rows } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'notes'
    `);
    
    if (rows.length === 0) {
      // Add the notes column
      await pool.query('ALTER TABLE tasks ADD COLUMN notes TEXT');
      console.log('✅ Added notes column to tasks table');
    } else {
      console.log('ℹ️  notes column already exists in tasks table');
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
  addNotesColumn()
    .then(() => {
      console.log('✅ Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default addNotesColumn; 