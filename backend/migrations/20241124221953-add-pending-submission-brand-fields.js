// migrations/20241124YYYYYY-add-pending-submission-brand-fields.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('PendingSubmissions', 'new_brand_image_path', {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        is: /\.(jpg|jpeg|png)$/
      }
    });

    await queryInterface.addColumn('PendingSubmissions', 'new_brand_description', {
      type: Sequelize.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    });

    // Add index for new_brand_image_path to improve query performance
    await queryInterface.addIndex('PendingSubmissions', ['new_brand_image_path'], {
      name: 'pending_submissions_brand_image_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('PendingSubmissions', 'pending_submissions_brand_image_idx');
    await queryInterface.removeColumn('PendingSubmissions', 'new_brand_description');
    await queryInterface.removeColumn('PendingSubmissions', 'new_brand_image_path');
  }
};