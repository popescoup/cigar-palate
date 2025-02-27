'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Try to remove the old constraint if it exists
      await queryInterface.removeConstraint('FlavorRankings', 'unique_cigar_flavor')
        .catch(error => {
          // If constraint doesn't exist, that's fine
          console.log('unique_cigar_flavor constraint not found, continuing...');
        });

      // Try to remove the existing user_cigar_flavor constraint if it exists
      await queryInterface.removeConstraint('FlavorRankings', 'unique_user_cigar_flavor')
        .catch(error => {
          // If constraint doesn't exist, that's fine
          console.log('unique_user_cigar_flavor constraint already removed, continuing...');
        });

      // Add the new constraint
      await queryInterface.addConstraint('FlavorRankings', {
        fields: ['userId', 'cigarId', 'flavor'],
        type: 'unique',
        name: 'unique_user_cigar_flavor'
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeConstraint('FlavorRankings', 'unique_user_cigar_flavor')
        .catch(error => {
          console.log('unique_user_cigar_flavor constraint not found, continuing...');
        });

      await queryInterface.addConstraint('FlavorRankings', {
        fields: ['cigarId', 'flavor'],
        type: 'unique',
        name: 'unique_cigar_flavor'
      });
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};