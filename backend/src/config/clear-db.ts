import pool from './database';

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');

    // Clear all data from tables (in reverse order of dependencies)
    console.log('📝 Clearing tasks...');
    await pool.query('DELETE FROM tasks');
    
    console.log('📝 Clearing inspections...');
    await pool.query('DELETE FROM inspections');
    
    console.log('📝 Clearing users...');
    await pool.query('DELETE FROM users');

    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Database clearing failed:', error);
    throw error;
  }
}

// Run clearing if this file is executed directly
if (require.main === module) {
  clearDatabase()
    .then(() => {
      console.log('✅ Database clearing complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database clearing failed:', error);
      process.exit(1);
    });
}

export default clearDatabase; 