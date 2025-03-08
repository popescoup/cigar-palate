'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. Rename image_path to image_key in Brands table
      await queryInterface.renameColumn(
        'Brands',
        'image_path',
        'image_key'
      );

      console.log('Migration for Brands table completed successfully');

      // 2. Rename image_path to image_key in Cigars table
      await queryInterface.renameColumn(
        'Cigars',
        'image_path',
        'image_key'
      );

      console.log('Migration for Cigars table completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // 1. Revert rename in Brands table
      await queryInterface.renameColumn(
        'Brands',
        'image_key',
        'image_path'
      );

      console.log('Migration rollback for Brands table completed successfully');

      // 2. Revert rename in Cigars table
      await queryInterface.renameColumn(
        'Cigars',
        'image_key',
        'image_path'
      );

      console.log('Migration rollback for Cigars table completed successfully');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};