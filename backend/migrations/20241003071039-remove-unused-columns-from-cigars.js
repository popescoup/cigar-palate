'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Cigars', 'interactionCount');
    await queryInterface.removeColumn('Cigars', 'trending');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Cigars', 'interactionCount', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('Cigars', 'trending', {
      type: Sequelize.BOOLEAN,
      allowNull: true
    });
  }
};
