// migrations/20241124XXXXXX-add-brand-media-fields.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Brands', 'image_path', {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        is: /\.(jpg|jpeg|png)$/
      }
    });

    await queryInterface.addColumn('Brands', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    });

    // Add index for image_path to improve query performance
    await queryInterface.addIndex('Brands', ['image_path'], {
      name: 'brands_image_path_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Brands', 'brands_image_path_idx');
    await queryInterface.removeColumn('Brands', 'description');
    await queryInterface.removeColumn('Brands', 'image_path');
  }
};