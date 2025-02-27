'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Cigars', 'totalInteractions', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Cigars', 'lastInteractionDate', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Cigars', 'totalInteractions');
    await queryInterface.removeColumn('Cigars', 'lastInteractionDate');
  }
};
