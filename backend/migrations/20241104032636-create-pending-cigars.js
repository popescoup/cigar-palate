// migrations/YYYYMMDDHHMMSS-create-pending-cigars.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create an ENUM type for status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_pending_cigars_status" AS ENUM ('pending', 'approved', 'declined');
    `);

    // Create PendingCigars table
    await queryInterface.createTable('PendingCigars', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      image_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      brand_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Brands',
          key: 'id'
        }
      },
      new_brand: {
        type: Sequelize.STRING,
        allowNull: true
      },
      flavors: {
        type: Sequelize.STRING,
        allowNull: false
      },
      shape: {
        type: Sequelize.STRING,
        allowNull: false
      },
      size: {
        type: Sequelize.STRING,
        allowNull: false
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false
      },
      wrap_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      filler: {
        type: Sequelize.STRING,
        allowNull: false
      },
      country_of_origin: {
        type: Sequelize.STRING,
        allowNull: false
      },
      aging: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      handmade: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      submitter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      submission_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      status: {
        type: 'enum_pending_cigars_status',
        allowNull: false,
        defaultValue: 'pending'
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      review_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Add indexes
    await Promise.all([
      queryInterface.addIndex('PendingCigars', ['submitter_id']),
      queryInterface.addIndex('PendingCigars', ['status']),
      queryInterface.addIndex('PendingCigars', ['submission_date']),
      queryInterface.addIndex('PendingCigars', ['brand_id', 'name']),
      queryInterface.addIndex('PendingCigars', ['status', 'submission_date']),
      queryInterface.addIndex('PendingCigars', ['submitter_id', 'status'])
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await Promise.all([
      queryInterface.removeIndex('PendingCigars', ['submitter_id']),
      queryInterface.removeIndex('PendingCigars', ['status']),
      queryInterface.removeIndex('PendingCigars', ['submission_date']),
      queryInterface.removeIndex('PendingCigars', ['brand_id', 'name']),
      queryInterface.removeIndex('PendingCigars', ['status', 'submission_date']),
      queryInterface.removeIndex('PendingCigars', ['submitter_id', 'status'])
    ]);

    // Drop the table
    await queryInterface.dropTable('PendingCigars');

    // Drop the ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_pending_cigars_status";
    `);
  }
};