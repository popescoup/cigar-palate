'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new fields to Cigars table
    await queryInterface.addColumn('Cigars', 'interactionCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('Cigars', 'trending', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('Cigars', 'lastInteractionDate', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add new fields to Brands table
    await queryInterface.addColumn('Brands', 'averageRating', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('Brands', 'totalRatings', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove new fields from Cigars table
    await queryInterface.removeColumn('Cigars', 'interactionCount');
    await queryInterface.removeColumn('Cigars', 'trending');
    await queryInterface.removeColumn('Cigars', 'lastInteractionDate');

    // Remove new fields from Brands table
    await queryInterface.removeColumn('Brands', 'averageRating');
    await queryInterface.removeColumn('Brands', 'totalRatings');
  }
};