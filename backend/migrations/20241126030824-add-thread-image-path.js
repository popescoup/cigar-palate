// migrations/YYYYMMDDHHMMSS-add-thread-image-path.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Threads', 'image_path', {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        is: /\.(jpg|jpeg|png)$/
      }
    });

    // Add index for image_path to improve query performance
    await queryInterface.addIndex('Threads', ['image_path'], {
      name: 'threads_image_path_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Threads', 'threads_image_path_idx');
    await queryInterface.removeColumn('Threads', 'image_path');
  }
};