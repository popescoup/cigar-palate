// migrations/YYYYMMDDHHMMSS-verify-cigar-rating-columns.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist before adding them
    const columns = await queryInterface.describeTable('Cigars');
    
    const columnsToAdd = {};
    
    if (!columns.totalRatings) {
      columnsToAdd.totalRatings = {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      };
    }
    
    if (!columns.numberOfRatings) {
      columnsToAdd.numberOfRatings = {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      };
    }
    
    if (!columns.averageRating) {
      columnsToAdd.averageRating = {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      };
    }

    // Add any missing columns
    for (const [columnName, columnDefinition] of Object.entries(columnsToAdd)) {
      await queryInterface.addColumn('Cigars', columnName, columnDefinition);
    }

    // Add indexes if they don't exist
    try {
      await queryInterface.addIndex('Cigars', ['totalRatings'], {
        name: 'cigars_total_ratings_idx'
      });
    } catch (error) {
      console.log('Index cigars_total_ratings_idx might already exist');
    }

    try {
      await queryInterface.addIndex('Cigars', ['averageRating'], {
        name: 'cigars_average_rating_idx'
      });
    } catch (error) {
      console.log('Index cigars_average_rating_idx might already exist');
    }
  },

  async down(queryInterface, Sequelize) {
    // Don't remove these columns in down migration since they might be pre-existing
    // Just log that this migration was reversed
    console.log('Migration reversed, but columns were preserved for data integrity');
  }
};