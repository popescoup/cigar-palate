// migrations/YYYYMMDDHHMMSS-add-voting-system.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add vote_count to threads
    await queryInterface.addColumn('Threads', 'vote_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Add vote_count to replies
    await queryInterface.addColumn('Replies', 'vote_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Create new votes table
    await queryInterface.createTable('Votes', {
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
        },
        onDelete: 'CASCADE'
      },
      voteable_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      voteable_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vote_type: {
        type: Sequelize.ENUM('like', 'dislike'),
        allowNull: false
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

    // Add unique constraint
    await queryInterface.addIndex('Votes', ['user_id', 'voteable_id', 'voteable_type'], {
      unique: true,
      name: 'votes_unique_user_voteable'
    });

    // Migrate existing votes
    const [threadVotes] = await queryInterface.sequelize.query(
      'SELECT * FROM "ThreadVotes"'
    );
    const [replyVotes] = await queryInterface.sequelize.query(
      'SELECT * FROM "ReplyVotes"'
    );

    if (threadVotes.length > 0 || replyVotes.length > 0) {
      const votesToInsert = [
        ...threadVotes.map(v => ({
          user_id: v.user_id,
          voteable_id: v.thread_id,
          voteable_type: 'thread',
          vote_type: v.vote_type,
          created_at: v.created_at,
          updated_at: v.updated_at
        })),
        ...replyVotes.map(v => ({
          user_id: v.user_id,
          voteable_id: v.reply_id,
          voteable_type: 'reply',
          vote_type: v.vote_type,
          created_at: v.created_at,
          updated_at: v.updated_at
        }))
      ];

      await queryInterface.bulkInsert('Votes', votesToInsert);
    }

    // Update vote counts
    await queryInterface.sequelize.query(`
      UPDATE "Threads" t
      SET vote_count = (
        SELECT COUNT(CASE WHEN vote_type = 'like' THEN 1 END) -
               COUNT(CASE WHEN vote_type = 'dislike' THEN 1 END)
        FROM "Votes"
        WHERE voteable_type = 'thread'
        AND voteable_id = t.id
      );
    `);

    await queryInterface.sequelize.query(`
      UPDATE "Replies" r
      SET vote_count = (
        SELECT COUNT(CASE WHEN vote_type = 'like' THEN 1 END) -
               COUNT(CASE WHEN vote_type = 'dislike' THEN 1 END)
        FROM "Votes"
        WHERE voteable_type = 'reply'
        AND voteable_id = r.id
      );
    `);

    // Drop old tables
    await queryInterface.dropTable('ThreadVotes');
    await queryInterface.dropTable('ReplyVotes');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate old tables
    await queryInterface.createTable('ThreadVotes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      thread_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Threads',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      vote_type: {
        type: Sequelize.ENUM('like', 'dislike'),
        allowNull: false
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

    await queryInterface.createTable('ReplyVotes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      reply_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Replies',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      vote_type: {
        type: Sequelize.ENUM('like', 'dislike'),
        allowNull: false
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

    // Migrate data back
    const [votes] = await queryInterface.sequelize.query(
      'SELECT * FROM "Votes"'
    );

    const threadVotes = votes.filter(v => v.voteable_type === 'thread');
    const replyVotes = votes.filter(v => v.voteable_type === 'reply');

    if (threadVotes.length > 0) {
      await queryInterface.bulkInsert('ThreadVotes', threadVotes.map(v => ({
        thread_id: v.voteable_id,
        user_id: v.user_id,
        vote_type: v.vote_type,
        created_at: v.created_at,
        updated_at: v.updated_at
      })));
    }

    if (replyVotes.length > 0) {
      await queryInterface.bulkInsert('ReplyVotes', replyVotes.map(v => ({
        reply_id: v.voteable_id,
        user_id: v.user_id,
        vote_type: v.vote_type,
        created_at: v.created_at,
        updated_at: v.updated_at
      })));
    }

    // Remove vote_count columns
    await queryInterface.removeColumn('Threads', 'vote_count');
    await queryInterface.removeColumn('Replies', 'vote_count');

    // Drop new votes table
    await queryInterface.dropTable('Votes');
  }
};