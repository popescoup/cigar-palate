'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Create index for faster admin checks
    await queryInterface.addIndex('Users', ['isAdmin']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', ['isAdmin']);
    await queryInterface.removeColumn('Users', 'isAdmin');
  }
};
