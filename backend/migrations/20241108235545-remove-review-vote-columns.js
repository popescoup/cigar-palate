'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Reviews', 'upvotes');
    await queryInterface.removeColumn('Reviews', 'downvotes');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Reviews', 'upvotes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Reviews', 'downvotes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  }
};