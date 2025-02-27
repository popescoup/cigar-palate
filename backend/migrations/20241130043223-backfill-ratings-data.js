// migrations/YYYYMMDDHHMMSS-backfill-ratings-data.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Add a column to track if this cigar uses the legacy rating system
      await queryInterface.addColumn('Cigars', 'uses_legacy_ratings', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });

      // Mark all existing cigars with ratings as using the legacy system
      await queryInterface.sequelize.query(
        `UPDATE "Cigars" 
         SET uses_legacy_ratings = true 
         WHERE "numberOfRatings" > 0`
      );

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('Cigars', 'uses_legacy_ratings');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};