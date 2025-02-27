// scripts/manage-admins.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const sequelize = require('../config');
const { Op } = require('sequelize');  // Add this line to import Op

class AdminManager {
  static async createNewAdmin({ email, password, username }, creatorEmail, creatorPassword) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify creator is an admin and check password
      const creator = await User.findOne({
        where: { email: creatorEmail, isAdmin: true },
        transaction
      });

      if (!creator) {
        throw new Error('Unauthorized: Only existing admins can create new admins');
      }

      // Verify creator's password
      const validPassword = await bcrypt.compare(creatorPassword, creator.password);
      if (!validPassword) {
        throw new Error('Invalid creator password');
      }

      // Validate new admin password
      if (!password.match(/[A-Z]/)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!password.match(/[a-z]/)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (!password.match(/[^A-Za-z0-9]/)) {
        throw new Error('Password must contain at least one symbol');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user exists - now using Op correctly
      const existingUser = await User.findOne({
        where: { 
          [Op.or]: [
            { email },
            { username }
          ]
        },
        transaction
      });

      if (existingUser) {
        throw new Error(
          existingUser.email === email 
            ? 'Email is already registered' 
            : 'Username is already taken'
        );
      }

      // Hash password for new admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new admin
      const newAdmin = await User.create({
        email,
        username,
        password: hashedPassword,
        isAdmin: true,
        reputation: 0,
        bookmark_count: 0
      }, { transaction });

      await transaction.commit();
      return newAdmin;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = AdminManager;