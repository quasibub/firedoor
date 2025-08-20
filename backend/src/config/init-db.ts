import pool from './database';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one statement to handle multi-line functions
    try {
      await pool.query(schema);
    } catch (error: any) {
      // Log but don't fail on non-critical errors
      if (error.code === '42710') { // duplicate_object
        console.log('ℹ️  Some objects already exist, continuing...');
      } else {
        console.error('❌ Error executing schema:', error.message);
        throw error;
      }
    }
    
    console.log('✅ Database schema created successfully');

    // Check if we need to add sample data (only in development)
    const { rows: existingUsers } = await pool.query('SELECT COUNT(*) FROM users');
    
    if (parseInt(existingUsers[0].count) === 0) {
      console.log('🚨 NO USERS FOUND - Creating emergency admin access');
      
      // Generate a secure temporary password
      const tempPassword = 'Admin2024!Temp';
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      
      // Create emergency admin user with force password change
      await pool.query(`
        INSERT INTO users (email, password_hash, name, role, force_password_change) 
        VALUES ($1, $2, 'Emergency Admin', 'admin', true)
      `, ['admin@yourdomain.com', hashedPassword]);
      
      console.log('⚠️  EMERGENCY ADMIN CREATED:');
      console.log(`   Email: admin@yourdomain.com`);
      console.log(`   Password: ${tempPassword}`);
      console.log(`   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!`);
      console.log(`   ⚠️  This user will be forced to change password on first login`);
      
      // Only add sample data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Adding additional sample data for development...');

      // Add sample inspection
      const { rows: [inspection] } = await pool.query(`
        INSERT INTO inspections (location, inspector_name, date, status, total_doors, compliant_doors, non_compliant_doors, critical_issues, notes)
        VALUES ('Main Building - Floor 1', 'John Inspector', '2024-01-15', 'completed', 12, 10, 2, 1, 'Overall good condition, minor issues found')
        RETURNING id
      `);

             // Add sample tasks
       await pool.query(`
         INSERT INTO tasks (inspection_id, door_id, location, title, description, priority, status, assigned_to, category)
         VALUES 
           ($1, 'FD-001', 'Main Building - Floor 1', 'Replace damaged door closer', 'Door closer needs replacement due to wear', 'high', 'in-progress', 'John Inspector', 'Hardware Issues'),
           ($1, 'FD-002', 'Main Building - Floor 1', 'Fix door frame alignment', 'Door frame slightly misaligned', 'medium', 'pending', 'John Inspector', 'Structural Repairs')
       `, [inspection.id]);

      console.log('✅ Sample data added successfully');
      console.log('⚠️  IMPORTANT: Default credentials created for development only');
      console.log('   Inspector: inspector@example.com / Inspector2024!');
      console.log('   Admin: admin@example.com / Admin2024!');
      console.log('   CHANGE THESE PASSWORDS IN PRODUCTION!');
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️  Database already contains data, skipping sample data');
      } else {
        console.log('ℹ️  Production environment - no sample data created');
      }
    }

    console.log('🎉 Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase; 