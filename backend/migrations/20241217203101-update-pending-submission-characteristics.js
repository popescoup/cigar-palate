'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('PendingSubmissions', 'shape', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'size', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'color', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'wrap_type', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.changeColumn('PendingSubmissions', 'filler', {
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
      await queryInterface.changeColumn('PendingSubmissions', 'shape', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Parejos', 'Figurados']]
        }
      });

      await queryInterface.changeColumn('PendingSubmissions', 'size', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Corona', 'Petit Corona', 'Churchill', 'Robusto', 'Corona Gorda', 
                 'Double Corona', 'Pantela', 'Lonsdale', 'Grande', 'Pyramid', 
                 'Belisco', 'Torpedo', 'Perfecto', 'Culebra', 'Diadema']]
        }
      });

      await queryInterface.changeColumn('PendingSubmissions', 'color', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Double Claro (Candela)', 'Claro', 'Colorado Claro', 'Colorado', 
                 'Colorado Maduro', 'Maduro', 'Oscuro']]
        }
      });

      await queryInterface.changeColumn('PendingSubmissions', 'wrap_type', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Connecticut', 'Corojo', 'Habano', 'Maduro']]
        }
      });

      await queryInterface.changeColumn('PendingSubmissions', 'filler', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Long Filler', 'Short Filler']]
        }
      });
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};