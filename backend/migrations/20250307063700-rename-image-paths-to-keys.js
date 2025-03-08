'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. Rename image_path to image_key in PendingSubmissions table
      await queryInterface.renameColumn(
        'PendingSubmissions',
        'image_path',
        'image_key'
      );

      // 2. Rename new_brand_image_path to new_brand_image_key in PendingSubmissions table
      await queryInterface.renameColumn(
        'PendingSubmissions',
        'new_brand_image_path',
        'new_brand_image_key'
      );

      console.log('Migration for PendingSubmissions table completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // 1. Revert rename in PendingSubmissions table
      await queryInterface.renameColumn(
        'PendingSubmissions',
        'image_key',
        'image_path'
      );

      // 2. Revert rename in PendingSubmissions table
      await queryInterface.renameColumn(
        'PendingSubmissions',
        'new_brand_image_key',
        'new_brand_image_path'
      );

      console.log('Migration rollback for PendingSubmissions table completed successfully');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};