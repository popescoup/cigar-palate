'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all cigars
    const cigars = await queryInterface.sequelize.query(
      'SELECT id, "numberOfRatings" FROM "Cigars"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get review counts for each cigar
    const reviewCounts = await queryInterface.sequelize.query(
      'SELECT cigar_id, COUNT(*) as review_count FROM "Reviews" GROUP BY cigar_id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create a map of cigar_id to review_count
    const reviewCountMap = reviewCounts.reduce((acc, curr) => {
      acc[curr.cigar_id] = curr.review_count;
      return acc;
    }, {});

    // Update each cigar's totalInteractions
    for (const cigar of cigars) {
      const reviewCount = reviewCountMap[cigar.id] || 0;
      const totalInteractions = cigar.numberOfRatings + reviewCount;

      await queryInterface.bulkUpdate('Cigars',
        { totalInteractions: totalInteractions },
        { id: cigar.id }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // If needed, you can reset all totalInteractions to 0 here
    await queryInterface.bulkUpdate('Cigars', { totalInteractions: 0 }, {});
  }
};
