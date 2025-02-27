// migrations/[timestamp]_add_reply_count_to_threads.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the column
    await queryInterface.addColumn('Threads', 'reply_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Update existing threads with their reply counts
    const [results] = await queryInterface.sequelize.query(`
      UPDATE "Threads"
      SET reply_count = (
        SELECT COUNT(*)
        FROM "Replies"
        WHERE "Replies".thread_id = "Threads".id
      )
    `);

    // Add the index
    await queryInterface.addIndex('Threads', ['reply_count']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Threads', ['reply_count']);
    await queryInterface.removeColumn('Threads', 'reply_count');
  }
};