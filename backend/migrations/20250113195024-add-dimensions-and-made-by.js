'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add dimensions column to Cigars table
      await queryInterface.addColumn('Cigars', 'dimensions', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      // Add made_by column to Cigars table
      await queryInterface.addColumn('Cigars', 'made_by', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      // Add dimensions column to PendingSubmissions table
      await queryInterface.addColumn('PendingSubmissions', 'dimensions', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      // Add made_by column to PendingSubmissions table
      await queryInterface.addColumn('PendingSubmissions', 'made_by', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove columns from Cigars table
      await queryInterface.removeColumn('Cigars', 'dimensions');
      await queryInterface.removeColumn('Cigars', 'made_by');

      // Remove columns from PendingSubmissions table
      await queryInterface.removeColumn('PendingSubmissions', 'dimensions');
      await queryInterface.removeColumn('PendingSubmissions', 'made_by');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};