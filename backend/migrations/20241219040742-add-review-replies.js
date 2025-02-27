'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Reviews', 'parent_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Reviews',
          key: 'id'
        }
      });

      await queryInterface.addColumn('Reviews', 'path', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.addColumn('Reviews', 'depth', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });

      await queryInterface.addColumn('Reviews', 'reply_count', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });

      await queryInterface.addColumn('Reviews', 'is_edited', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });

      await queryInterface.addColumn('Reviews', 'edited_at', {
        type: Sequelize.DATE,
        allowNull: true
      });

      await queryInterface.addIndex('Reviews', ['parent_id'], {
        name: 'reviews_parent_id_idx'
      });

      await queryInterface.addIndex('Reviews', ['path'], {
        name: 'reviews_path_idx'
      });

      await queryInterface.addIndex('Reviews', ['depth'], {
        name: 'reviews_depth_idx'
      });

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('Reviews', 'reviews_depth_idx');
      await queryInterface.removeIndex('Reviews', 'reviews_path_idx');
      await queryInterface.removeIndex('Reviews', 'reviews_parent_id_idx');

      await queryInterface.removeColumn('Reviews', 'edited_at');
      await queryInterface.removeColumn('Reviews', 'is_edited');
      await queryInterface.removeColumn('Reviews', 'reply_count');
      await queryInterface.removeColumn('Reviews', 'depth');
      await queryInterface.removeColumn('Reviews', 'path');
      await queryInterface.removeColumn('Reviews', 'parent_id');

    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};