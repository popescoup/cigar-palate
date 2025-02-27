'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Clear existing rankings
    await queryInterface.bulkDelete('FlavorRankings', null, {});

    // Add userId column
    await queryInterface.addColumn('FlavorRankings', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      after: 'cigarId'
    });

    // Add an index without the unique constraint
    // This allows multiple flavors per user-cigar combination
    await queryInterface.addIndex('FlavorRankings', ['userId', 'cigarId'], {
      name: 'flavor_rankings_user_cigar_idx'
    });

    // Add a compound unique constraint including the flavor
    await queryInterface.addConstraint('FlavorRankings', {
      fields: ['userId', 'cigarId', 'flavor'],
      type: 'unique',
      name: 'unique_user_cigar_flavor'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('FlavorRankings', 'unique_user_cigar_flavor');
    await queryInterface.removeIndex('FlavorRankings', 'flavor_rankings_user_cigar_idx');
    await queryInterface.removeColumn('FlavorRankings', 'userId');
  }
};