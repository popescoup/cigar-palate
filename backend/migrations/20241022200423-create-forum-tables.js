'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Threads', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.createTable('Replies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      thread_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Threads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.createTable('Tags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      }
    });

    await queryInterface.createTable('ThreadTags', {
      thread_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'Threads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'Tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    // Add indexes matching your style
    await queryInterface.addIndex('Threads', ['user_id']);
    await queryInterface.addIndex('Threads', ['created_at']);
    await queryInterface.addIndex('Replies', ['thread_id']);
    await queryInterface.addIndex('Replies', ['user_id']);
    await queryInterface.addIndex('Tags', ['name'], { unique: true });
    await queryInterface.addIndex('ThreadTags', ['thread_id']);
    await queryInterface.addIndex('ThreadTags', ['tag_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ThreadTags');
    await queryInterface.dropTable('Tags');
    await queryInterface.dropTable('Replies');
    await queryInterface.dropTable('Threads');
  }
};