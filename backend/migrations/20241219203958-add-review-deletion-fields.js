'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Reviews', 'is_deleted', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });

      await queryInterface.addColumn('Reviews', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true
      });

      await queryInterface.addIndex('Reviews', ['is_deleted'], {
        name: 'reviews_is_deleted_idx'
      });

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('Reviews', 'reviews_is_deleted_idx');
      await queryInterface.removeColumn('Reviews', 'deleted_at');
      await queryInterface.removeColumn('Reviews', 'is_deleted');

    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};