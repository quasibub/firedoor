import pool from './database';
import fs from 'fs';
import path from 'path';

async function addWorkmenFeatures() {
  try {
    console.log('🔄 Adding workmen features to database...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'add-workmen-features.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await pool.query(statement);
      }
    }
    
    console.log('✅ Workmen features added successfully');
    
    // Verify the changes
    console.log('🔍 Verifying changes...');
    
    // Check new tables
    const { rows: tables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('task_photos', 'task_rejections')
    `);
    console.log('New tables created:', tables);
    
    // Check user role constraint
    const { rows: userConstraints } = await pool.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%users_role%'
    `);
    console.log('User role constraints:', userConstraints);
    
    // Check task status constraint
    const { rows: taskConstraints } = await pool.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%tasks_status%'
    `);
    console.log('Task status constraints:', taskConstraints);
    
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
  addWorkmenFeatures()
    .then(() => {
      console.log('✅ Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default addWorkmenFeatures; 