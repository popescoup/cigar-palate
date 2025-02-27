// migrations/[timestamp]_add_bookmarks_counter_to_threads.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Threads', 'total_bookmarks', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Add index for performance
    await queryInterface.addIndex('Threads', ['total_bookmarks'], {
      name: 'threads_total_bookmarks_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Threads', 'threads_total_bookmarks_idx');
    await queryInterface.removeColumn('Threads', 'total_bookmarks');
  }
};