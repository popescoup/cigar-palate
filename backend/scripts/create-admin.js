// scripts/create-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const sequelize = require('../config');

async function createAdmin() {
  const transaction = await sequelize.transaction();
  
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminUsername = process.env.ADMIN_USERNAME;

    if (!adminEmail || !adminPassword || !adminUsername) {
      console.error('Admin credentials must be set in environment variables:');
      console.error('ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create or update admin user
    const [admin, created] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true
      },
      transaction
    });

    if (!created) {
      // Update existing user to be admin if not already
      await admin.update({
        isAdmin: true,
        username: adminUsername,
        password: hashedPassword
      }, { transaction });
    }

    await transaction.commit();
    console.log(created ? 'Admin user created successfully' : 'Existing user updated to admin');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();