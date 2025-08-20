import pool from './database';

async function addForcePasswordChangeColumn() {
  try {
    console.log('🔄 Adding force_password_change column to users table...');
    
    // Check if column already exists
    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'force_password_change'
    `);
    
    if (columns.length > 0) {
      console.log('ℹ️  force_password_change column already exists');
      return;
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN force_password_change BOOLEAN DEFAULT FALSE
    `);
    
    console.log('✅ force_password_change column added successfully');
    
    // Update existing users to not force password change
    await pool.query(`
      UPDATE users 
      SET force_password_change = FALSE 
      WHERE force_password_change IS NULL
    `);
    
    console.log('✅ Updated existing users to not force password change');
    
  } catch (error) {
    console.error('❌ Failed to add force_password_change column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  addForcePasswordChangeColumn()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default addForcePasswordChangeColumn;
