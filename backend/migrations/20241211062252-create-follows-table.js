// migrations/YYYYMMDDHHMMSS-create-follows-table.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Follows', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      follower_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      following_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('Follows', ['follower_id', 'following_id'], {
      unique: true,
      name: 'follows_follower_following_unique'
    });
    await queryInterface.addIndex('Follows', ['follower_id'], {
      name: 'follows_follower_idx'
    });
    await queryInterface.addIndex('Follows', ['following_id'], {
      name: 'follows_following_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Follows');
  }
};