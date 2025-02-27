// migrations/YYYYMMDDHHMMSS-create-vote-tables.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ThreadVotes table
    await queryInterface.createTable('ThreadVotes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      thread_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Threads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      vote_type: {
        type: Sequelize.ENUM('like', 'dislike'),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create ReplyVotes table
    await queryInterface.createTable('ReplyVotes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reply_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Replies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      vote_type: {
        type: Sequelize.ENUM('like', 'dislike'),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraints
    await queryInterface.addIndex('ThreadVotes', ['thread_id', 'user_id'], {
      unique: true
    });
    await queryInterface.addIndex('ReplyVotes', ['reply_id', 'user_id'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ReplyVotes');
    await queryInterface.dropTable('ThreadVotes');
  }
};