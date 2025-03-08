'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Rename image_path to image_key in Threads table
      await queryInterface.renameColumn(
        'Threads',
        'image_path',
        'image_key'
      );

      console.log('Migration for Threads table completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Revert rename in Threads table
      await queryInterface.renameColumn(
        'Threads',
        'image_key',
        'image_path'
      );

      console.log('Migration rollback for Threads table completed successfully');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};