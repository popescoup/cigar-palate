// scripts/create-new-admin.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // Explicitly set path to .env

console.log('Environment Variables:');
console.log('DB_DIALECT:', process.env.DB_DIALECT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('Working Directory:', process.cwd());
console.log('Script Location:', __dirname);

const AdminManager = require('./manage-admins');
const sequelize = require('../config');

async function createNewAdminFromCLI() {
  const args = process.argv.slice(2);
  
  if (args.length !== 5) {
    console.error('\nError: Incorrect number of arguments');
    console.error('\nUsage:');
    console.error('node create-new-admin.js <creator_email> <creator_password> <new_admin_email> <new_admin_username> <new_admin_password>');
    console.error('\nPassword requirements:');
    console.error('- At least 8 characters long');
    console.error('- At least one uppercase letter');
    console.error('- At least one lowercase letter');
    console.error('- At least one special character');
    console.error('\nExample:');
    console.error('node create-new-admin.js existing@admin.com AdminPass123! new@admin.com newadmin NewPass123!\n');
    process.exit(1);
  }

  const [creatorEmail, creatorPassword, newAdminEmail, newAdminUsername, newAdminPassword] = args;

  try {
    console.log('\nValidating inputs...');
    console.log('- Creator email:', creatorEmail);
    console.log('- New admin email:', newAdminEmail);
    console.log('- New admin username:', newAdminUsername);

    const newAdmin = await AdminManager.createNewAdmin({
      email: newAdminEmail,
      username: newAdminUsername,
      password: newAdminPassword
    }, creatorEmail, creatorPassword);

    console.log('\nNew admin created successfully!');
    console.log('Details:');
    console.log('- Email:', newAdmin.email);
    console.log('- Username:', newAdmin.username);
    console.log('- Created at:', newAdmin.created_at);
    console.log('\nThe new admin can now log in using these credentials\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

createNewAdminFromCLI();