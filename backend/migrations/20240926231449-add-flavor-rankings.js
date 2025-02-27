'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FlavorRankings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cigarId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Cigars',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      flavor: {
        type: Sequelize.STRING,
        allowNull: false
      },
      totalRank: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      voteCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add a unique constraint to prevent duplicate entries
    await queryInterface.addConstraint('FlavorRankings', {
      fields: ['cigarId', 'flavor'],
      type: 'unique',
      name: 'unique_cigar_flavor'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FlavorRankings');
  }
};