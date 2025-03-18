'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE "Votes" DROP CONSTRAINT IF EXISTS "Votes_voteable_id_fkey";'
      );
      console.log('Successfully dropped foreign key constraint on Votes table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error dropping constraint:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Optionally recreate the constraint if needed
    // Usually best to leave this empty for this kind of fix
    return Promise.resolve();
  }
};