// migrations/YYYYMMDDHHMMSS-remove-interaction-columns.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the columns and any associated indexes
    await queryInterface.removeIndex('Cigars', 'cigars_total_interactions_idx');
    await queryInterface.removeIndex('Cigars', 'cigars_last_interaction_date_idx');
    await queryInterface.removeColumn('Cigars', 'totalInteractions');
    await queryInterface.removeColumn('Cigars', 'lastInteractionDate');
  },

  async down(queryInterface, Sequelize) {
    // Add the columns back if we need to rollback
    await queryInterface.addColumn('Cigars', 'totalInteractions', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Cigars', 'lastInteractionDate', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addIndex('Cigars', ['totalInteractions'], {
      name: 'cigars_total_interactions_idx'
    });
    await queryInterface.addIndex('Cigars', ['lastInteractionDate'], {
      name: 'cigars_last_interaction_date_idx'
    });
  }
};