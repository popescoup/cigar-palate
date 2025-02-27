// migrations/20241030195009-add-parent-id-to-replies.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('Replies', 'parent_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Replies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      await queryInterface.addIndex('Replies', ['parent_id'], {
        name: 'replies_parent_id_idx'
      });
    } catch (error) {
      console.error('Error adding parent_id column:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('Replies', 'replies_parent_id_idx');
      await queryInterface.removeColumn('Replies', 'parent_id');
    } catch (error) {
      console.error('Error removing parent_id column:', error);
      throw error;
    }
  }
};