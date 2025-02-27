// migrations/[timestamp]_modify_bookmarks_table.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Add content_type first
      await queryInterface.addColumn('Bookmarks', 'content_type', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'cigar'
      });

      // Get existing constraints
      const constraints = await queryInterface.showConstraint('Bookmarks');
      
      // Remove constraints if they exist
      for (const constraint of constraints) {
        if (constraint.constraintName.includes('cigar_id_fkey')) {
          await queryInterface.removeConstraint('Bookmarks', constraint.constraintName);
        }
        if (constraint.constraintName.includes('user_id_cigar_id')) {
          await queryInterface.removeConstraint('Bookmarks', constraint.constraintName);
        }
      }

      // Rename column
      await queryInterface.renameColumn('Bookmarks', 'cigar_id', 'content_id');

      // Add new unique constraint
      await queryInterface.addConstraint('Bookmarks', {
        fields: ['user_id', 'content_type', 'content_id'],
        type: 'unique',
        name: 'bookmarks_user_content_unique'
      });
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remove new constraint
      await queryInterface.removeConstraint('Bookmarks', 'bookmarks_user_content_unique');

      // Rename column back
      await queryInterface.renameColumn('Bookmarks', 'content_id', 'cigar_id');

      // Remove content_type
      await queryInterface.removeColumn('Bookmarks', 'content_type');

      // Restore original constraints
      await queryInterface.addConstraint('Bookmarks', {
        fields: ['cigar_id'],
        type: 'foreign key',
        references: {
          table: 'Cigars',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      await queryInterface.addConstraint('Bookmarks', {
        fields: ['user_id', 'cigar_id'],
        type: 'unique',
        name: 'bookmarks_user_cigar_unique'
      });
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};