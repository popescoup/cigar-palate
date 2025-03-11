// scripts/promote-to-admin.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const sequelize = require('../config');

console.log('Environment Variables:');
console.log('DB_DIALECT:', process.env.DB_DIALECT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('Working Directory:', process.cwd());
console.log('Script Location:', __dirname);

async function promoteToAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.error('\nError: Incorrect number of arguments');
    console.error('\nUsage:');
    console.error('node promote-to-admin.js <username> <email> <admin_code>');
    console.error('\nAll three parameters are required:');
    console.error('- username: The username of the existing user to promote');
    console.error('- email: The email of the existing user to promote');
    console.error('- admin_code: The secure admin code from environment variables');
    console.error('\nExample:');
    console.error('node promote-to-admin.js johndoe john@example.com SecureAdminCode123!\n');
    process.exit(1);
  }

  const [username, email, providedAdminCode] = args;
  const storedAdminCode = process.env.ADMIN_CODE;

  if (!storedAdminCode) {
    console.error('\nError: ADMIN_CODE environment variable is not set');
    console.error('Please set the ADMIN_CODE in your .env file\n');
    process.exit(1);
  }

  const transaction = await sequelize.transaction();
  
  try {
    console.log('\nValidating inputs...');
    console.log('- Username:', username);
    console.log('- Email:', email);
    console.log('- Admin code provided:', '********');

    // Direct comparison for unencrypted admin code
    const isValidCode = providedAdminCode === storedAdminCode;
    
    if (!isValidCode) {
      throw new Error('Invalid admin code');
    }

    // Find the user to promote
    const userToPromote = await User.findOne({
      where: { 
        username,
        email 
      },
      transaction
    });

    if (!userToPromote) {
      throw new Error('User not found with the provided username and email');
    }

    if (userToPromote.isAdmin) {
      console.log('\nNotice: User is already an admin. No changes made.\n');
      await transaction.commit();
      process.exit(0);
    }

    // Update user to admin
    await userToPromote.update({
      isAdmin: true
    }, { transaction });

    await transaction.commit();
    
    console.log('\nUser promoted to admin successfully!');
    console.log('Details:');
    console.log('- Username:', userToPromote.username);
    console.log('- Email:', userToPromote.email);
    console.log('- Updated at:', new Date().toISOString());
    console.log('\nThe user now has administrative privileges\n');
    
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

promoteToAdmin();