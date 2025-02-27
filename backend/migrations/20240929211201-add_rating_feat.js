'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Cigars', 'totalRatings', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Cigars', 'numberOfRatings', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Cigars', 'averageRating', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Cigars', 'totalRatings');
    await queryInterface.removeColumn('Cigars', 'numberOfRatings');
    await queryInterface.removeColumn('Cigars', 'averageRating');
  }
};