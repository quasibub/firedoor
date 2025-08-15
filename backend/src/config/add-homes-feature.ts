import pool from '../config/database';
import fs from 'fs';
import path from 'path';

async function addHomesFeature() {
  try {
    console.log('🏠 Adding homes feature to database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-homes-feature.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await pool.query(statement);
      }
    }
    
    console.log('✅ Homes feature added successfully!');
    
    // Verify the changes
    console.log('🔍 Verifying changes...');
    
    const { rows: homes } = await pool.query('SELECT COUNT(*) as count FROM homes');
    console.log(`Found ${homes[0].count} homes in database`);
    
    const { rows: inspections } = await pool.query('SELECT COUNT(*) as count FROM inspections WHERE home_id IS NOT NULL');
    console.log(`Found ${inspections[0].count} inspections with home_id`);
    
    const { rows: tasks } = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE home_id IS NOT NULL');
    console.log(`Found ${tasks[0].count} tasks with home_id`);
    
    console.log('🎉 Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addHomesFeature(); 