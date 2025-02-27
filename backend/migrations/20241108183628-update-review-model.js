// migrations/YYYYMMDDHHMMSS-update-review-model.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add vote_count column
    await queryInterface.addColumn('Reviews', 'vote_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Modify upvotes to have default of 1
    await queryInterface.changeColumn('Reviews', 'upvotes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    // Add indexes for vote-related queries
    await queryInterface.addIndex('Reviews', ['vote_count'], {
      name: 'reviews_vote_count_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove vote_count column
    await queryInterface.removeColumn('Reviews', 'vote_count');

    // Revert upvotes default value
    await queryInterface.changeColumn('Reviews', 'upvotes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Remove the index
    await queryInterface.removeIndex('Reviews', 'reviews_vote_count_idx');
  }
};