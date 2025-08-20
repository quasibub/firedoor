import pool from '../src/config/database';
import bcrypt from 'bcryptjs';

async function updateDefaultPasswords() {
  try {
    console.log('🔄 Updating default passwords for existing users...');
    
    // Check for users with weak passwords (you might need to adjust this logic)
    const { rows: users } = await pool.query(`
      SELECT id, email, role FROM users 
      WHERE email IN ('inspector@example.com', 'admin@example.com')
    `);
    
    if (users.length === 0) {
      console.log('ℹ️  No default users found to update');
      return;
    }
    
    console.log(`📝 Found ${users.length} users to update`);
    
    for (const user of users) {
      let newPassword: string;
      
      if (user.role === 'admin') {
        newPassword = 'Admin2024!';
      } else {
        newPassword = 'Inspector2024!';
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, user.id]
      );
      
      console.log(`✅ Updated password for ${user.email} (${user.role})`);
      console.log(`   New password: ${newPassword}`);
    }
    
    console.log('🎉 Password update completed successfully');
    console.log('⚠️  IMPORTANT: Change these passwords after first login!');
    
  } catch (error) {
    console.error('❌ Failed to update passwords:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  updateDefaultPasswords()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default updateDefaultPasswords;
