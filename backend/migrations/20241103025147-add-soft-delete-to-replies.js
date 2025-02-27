// New migration file (e.g., YYYYMMDDHHMMSS-add-soft-delete-to-replies.js)
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.addColumn('Replies', 'is_deleted', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }),
      queryInterface.addColumn('Replies', 'has_children', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      })
    ]);

    // Add index for is_deleted
    await queryInterface.addIndex('Replies', ['is_deleted']);
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.removeColumn('Replies', 'is_deleted'),
      queryInterface.removeColumn('Replies', 'has_children'),
      queryInterface.removeIndex('Replies', ['is_deleted'])
    ]);
  }
};