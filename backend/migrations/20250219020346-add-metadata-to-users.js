'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    // Create index for JSON path operations
    await queryInterface.addIndex('Users', ['metadata']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', ['metadata']);
    await queryInterface.removeColumn('Users', 'metadata');
  }
};