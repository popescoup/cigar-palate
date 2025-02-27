'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Cigars', 'totalInteractions');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Cigars', 'totalInteractions', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};
