// migrations/YYYYMMDDHHMMSS-create-pending-brands.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First create the enum type for status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_pending_brands_status" AS ENUM ('pending', 'approved', 'declined');
    `);

    // Then create the PendingBrands table
    await queryInterface.createTable('PendingBrands', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          len: [1, 50]
        }
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
        type: 'enum_pending_brands_status',
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
      queryInterface.addIndex('PendingBrands', ['name'], {
        name: 'pending_brand_name_idx'
      }),
      queryInterface.addIndex('PendingBrands', ['status', 'submission_date'], {
        name: 'pending_brand_status_date_idx'
      }),
      queryInterface.addIndex('PendingBrands', ['submitter_id', 'status'], {
        name: 'pending_brand_submitter_status_idx'
      })
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await Promise.all([
      queryInterface.removeIndex('PendingBrands', 'pending_brand_name_idx'),
      queryInterface.removeIndex('PendingBrands', 'pending_brand_status_date_idx'),
      queryInterface.removeIndex('PendingBrands', 'pending_brand_submitter_status_idx')
    ]);

    // Drop the table
    await queryInterface.dropTable('PendingBrands');

    // Drop the enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_pending_brands_status";
    `);
  }
};