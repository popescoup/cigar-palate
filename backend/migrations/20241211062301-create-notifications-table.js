// migrations/YYYYMMDDHHMMSS-create-notifications-table.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      type: {
        type: Sequelize.ENUM('follow', 'thread', 'reply', 'review'),
        allowNull: false
      },
      reference_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      actor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    await queryInterface.addIndex('Notifications', ['user_id'], {
      name: 'notifications_user_idx'
    });
    await queryInterface.addIndex('Notifications', ['type'], {
      name: 'notifications_type_idx'
    });
    await queryInterface.addIndex('Notifications', ['read'], {
      name: 'notifications_read_idx'
    });
    await queryInterface.addIndex('Notifications', ['created_at'], {
      name: 'notifications_created_at_idx'
    });
    await queryInterface.addIndex('Notifications', ['actor_id'], {
      name: 'notifications_actor_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Notifications');
  }
};