'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('PendingSubmissions', 'shape', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'size', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'color', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'wrap_type', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'filler', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'country_of_origin', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'aging', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('PendingSubmissions', 'shape', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('PendingSubmissions', 'size', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('PendingSubmissions', 'color', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('PendingSubmissions', 'wrap_type', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('PendingSubmissions', 'filler', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('PendingSubmissions', 'country_of_origin', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('PendingSubmissions', 'aging', {
        type: Sequelize.INTEGER,
        allowNull: false
      });
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};