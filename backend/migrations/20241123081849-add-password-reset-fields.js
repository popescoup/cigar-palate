// migrations/[timestamp]-add-password-reset-fields.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'resetToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'resetTokenExpiry', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addIndex('Users', ['resetToken'], {
      name: 'users_reset_token_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'users_reset_token_idx');
    await queryInterface.removeColumn('Users', 'resetTokenExpiry');
    await queryInterface.removeColumn('Users', 'resetToken');
  }
};