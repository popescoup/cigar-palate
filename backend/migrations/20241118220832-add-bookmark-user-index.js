'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add index on user_id for optimized bookmark fetching
    await queryInterface.addIndex(
      'Bookmarks',
      ['user_id'],
      {
        name: 'bookmarks_user_id_idx'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Bookmarks', 'bookmarks_user_id_idx');
  }
};