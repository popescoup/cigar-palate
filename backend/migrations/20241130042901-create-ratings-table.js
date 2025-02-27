// migrations/YYYYMMDDHHMMSS-create-ratings-table.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Ratings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cigar_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Cigars',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rating_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('Ratings', ['user_id'], {
      name: 'ratings_user_id_idx'
    });
    await queryInterface.addIndex('Ratings', ['cigar_id'], {
      name: 'ratings_cigar_id_idx'
    });
    await queryInterface.addIndex('Ratings', ['created_at'], {
      name: 'ratings_created_at_idx'
    });
    await queryInterface.addIndex('Ratings', ['user_id', 'cigar_id'], {
      unique: true,
      name: 'unique_user_cigar_rating'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Ratings', 'ratings_user_id_idx');
    await queryInterface.removeIndex('Ratings', 'ratings_cigar_id_idx');
    await queryInterface.removeIndex('Ratings', 'ratings_created_at_idx');
    await queryInterface.removeIndex('Ratings', 'unique_user_cigar_rating');
    await queryInterface.dropTable('Ratings');
  }
};