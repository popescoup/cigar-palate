'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Cigars', 'lastInteractionDate');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Cigars', 'lastInteractionDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
  }
};
