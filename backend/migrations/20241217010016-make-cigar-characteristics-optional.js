'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('Cigars', 'shape', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'size', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'color', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'wrap_type', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'filler', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'country_of_origin', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'aging', {
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
      await queryInterface.changeColumn('Cigars', 'shape', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('Cigars', 'size', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('Cigars', 'color', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('Cigars', 'wrap_type', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('Cigars', 'filler', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('Cigars', 'country_of_origin', {
        type: Sequelize.STRING,
        allowNull: false
      });

      await queryInterface.changeColumn('Cigars', 'aging', {
        type: Sequelize.INTEGER,
        allowNull: false
      });
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};