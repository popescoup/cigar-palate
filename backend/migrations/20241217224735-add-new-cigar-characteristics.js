'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('PendingSubmissions', 'price_range', {
        type: Sequelize.STRING(20),
        allowNull: true
      });

      await queryInterface.addColumn('PendingSubmissions', 'strength', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.addColumn('PendingSubmissions', 'binder', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.addColumn('Cigars', 'price_range', {
        type: Sequelize.STRING(20),
        allowNull: true
      });

      await queryInterface.addColumn('Cigars', 'strength', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.addColumn('Cigars', 'binder', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.addIndex('Cigars', ['price_range'], {
        name: 'cigars_price_range_idx'
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('Cigars', 'cigars_price_range_idx');
      
      await queryInterface.removeColumn('PendingSubmissions', 'price_range');
      await queryInterface.removeColumn('PendingSubmissions', 'strength');
      await queryInterface.removeColumn('PendingSubmissions', 'binder');
      
      await queryInterface.removeColumn('Cigars', 'price_range');
      await queryInterface.removeColumn('Cigars', 'strength');
      await queryInterface.removeColumn('Cigars', 'binder');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};