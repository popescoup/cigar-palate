'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First remove existing indexes if they exist
      await queryInterface.removeIndex('Cigars', 'cigars_size_idx').catch(() => {});
      await queryInterface.removeIndex('Cigars', 'cigars_color_idx').catch(() => {});
      await queryInterface.removeIndex('Cigars', 'cigars_wrap_type_idx').catch(() => {});
      
      // Update columns
      await queryInterface.changeColumn('Cigars', 'shape', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'size', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'color', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'wrap_type', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.changeColumn('Cigars', 'filler', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      // Recreate indexes
      await queryInterface.addIndex('Cigars', ['size'], {
        name: 'cigars_size_idx'
      });

      await queryInterface.addIndex('Cigars', ['color'], {
        name: 'cigars_color_idx'
      });

      await queryInterface.addIndex('Cigars', ['wrap_type'], {
        name: 'cigars_wrap_type_idx'
      });

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove the indexes
      await queryInterface.removeIndex('Cigars', 'cigars_size_idx').catch(() => {});
      await queryInterface.removeIndex('Cigars', 'cigars_color_idx').catch(() => {});
      await queryInterface.removeIndex('Cigars', 'cigars_wrap_type_idx').catch(() => {});

      // Revert columns with original constraints
      await queryInterface.changeColumn('Cigars', 'shape', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Parejos', 'Figurados']]
        }
      });

      await queryInterface.changeColumn('Cigars', 'size', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Corona', 'Petit Corona', 'Churchill', 'Robusto', 'Corona Gorda', 
                 'Double Corona', 'Pantela', 'Lonsdale', 'Grande', 'Pyramid', 
                 'Belisco', 'Torpedo', 'Perfecto', 'Culebra', 'Diadema']]
        }
      });

      await queryInterface.changeColumn('Cigars', 'color', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Double Claro (Candela)', 'Claro', 'Colorado Claro', 'Colorado', 
                 'Colorado Maduro', 'Maduro', 'Oscuro']]
        }
      });

      await queryInterface.changeColumn('Cigars', 'wrap_type', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Connecticut', 'Corojo', 'Habano', 'Maduro']]
        }
      });

      await queryInterface.changeColumn('Cigars', 'filler', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isIn: [['Long Filler', 'Short Filler']]
        }
      });

      // Recreate original indexes
      await queryInterface.addIndex('Cigars', ['size'], {
        name: 'cigars_size_idx'
      });

      await queryInterface.addIndex('Cigars', ['color'], {
        name: 'cigars_color_idx'
      });

      await queryInterface.addIndex('Cigars', ['wrap_type'], {
        name: 'cigars_wrap_type_idx'
      });

    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};