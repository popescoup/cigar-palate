// migrations/20241205000000-add-accepts-emails.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Add column with allowNull: true initially
    await queryInterface.addColumn('Users', 'acceptsEmails', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null
    });

    // Step 2: Update all existing records to have acceptsEmails = false
    await queryInterface.sequelize.query(`
      UPDATE "Users"
      SET "acceptsEmails" = false
      WHERE "acceptsEmails" IS NULL
    `);

    // Step 3: Change column to not allow null after all records have been updated
    await queryInterface.changeColumn('Users', 'acceptsEmails', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Step 4: Add the index
    await queryInterface.addIndex('Users', ['acceptsEmails'], {
      name: 'users_accepts_emails_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'users_accepts_emails_idx');
    await queryInterface.removeColumn('Users', 'acceptsEmails');
  }
};