'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add total_bookmarks to Cigars table
      await queryInterface.addColumn(
        'Cigars',
        'total_bookmarks',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        { transaction }
      );

      // Add bookmark_count to Users table
      await queryInterface.addColumn(
        'Users',
        'bookmark_count',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        { transaction }
      );

      // Create Bookmarks table
      await queryInterface.createTable('Bookmarks', {
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
        cigar_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Cigars',
            key: 'id'
          },
          onDelete: 'CASCADE'
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
      }, { transaction });

      // Add unique constraint to prevent duplicate bookmarks
      await queryInterface.addIndex(
        'Bookmarks',
        ['user_id', 'cigar_id'],
        {
          unique: true,
          name: 'bookmarks_user_cigar_unique',
          transaction
        }
      );

      // Add index on total_bookmarks for performance
      await queryInterface.addIndex(
        'Cigars',
        ['total_bookmarks'],
        {
          name: 'cigars_total_bookmarks_idx',
          transaction
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove indexes
      await queryInterface.removeIndex('Bookmarks', 'bookmarks_user_cigar_unique', { transaction });
      await queryInterface.removeIndex('Cigars', 'cigars_total_bookmarks_idx', { transaction });

      // Remove Bookmarks table
      await queryInterface.dropTable('Bookmarks', { transaction });

      // Remove columns from Cigars and Users
      await queryInterface.removeColumn('Cigars', 'total_bookmarks', { transaction });
      await queryInterface.removeColumn('Users', 'bookmark_count', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
