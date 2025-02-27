'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add the new enum value
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Notifications_type" ADD VALUE IF NOT EXISTS 'review_reply';
      `);
      
      console.log('Successfully added review_reply to notification types');
    } catch (error) {
      // If the error is that the enum value already exists, that's fine
      if (error.message.includes('already exists')) {
        console.log('review_reply value already exists in enum');
        return;
      }
      
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Skipping enum value removal as it is not safely possible in PostgreSQL');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};