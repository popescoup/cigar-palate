// migrations/20241123081850-add-email-verification-fields.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'isVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('Users', 'verificationToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'verificationExpiry', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Mark all existing users as verified
    await queryInterface.sequelize.query(
      `UPDATE "Users" SET "isVerified" = true WHERE "created_at" < NOW()`
    );

    await queryInterface.addIndex('Users', ['isVerified'], {
      name: 'users_is_verified_idx'
    });

    await queryInterface.addIndex('Users', ['verificationToken'], {
      name: 'users_verification_token_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'users_is_verified_idx');
    await queryInterface.removeIndex('Users', 'users_verification_token_idx');
    await queryInterface.removeColumn('Users', 'verificationExpiry');
    await queryInterface.removeColumn('Users', 'verificationToken');
    await queryInterface.removeColumn('Users', 'isVerified');
  }
};