'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "Cigars" c
      SET "totalInteractions" = (
        SELECT COALESCE(COUNT(r.id), 0) + c."numberOfRatings"
        FROM "Reviews" r
        WHERE r.cigar_id = c.id
      )
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // There's no safe way to revert this change, as we don't know the previous values.
    // If you need to revert, you'd need to restore from a backup.
    console.log('This migration cannot be undone automatically.');
  }
};
