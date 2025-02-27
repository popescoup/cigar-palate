'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First remove the indexes that reference status
    await Promise.all([
      queryInterface.removeIndex('PendingCigars', 'pending_cigar_status_date_idx'),
      queryInterface.removeIndex('PendingCigars', 'pending_cigar_submitter_status_idx'),
      queryInterface.removeIndex('PendingBrands', 'pending_brand_status_date_idx'),
      queryInterface.removeIndex('PendingBrands', 'pending_brand_submitter_status_idx')
    ]);

    // Remove status columns
    await Promise.all([
      queryInterface.removeColumn('PendingCigars', 'status'),
      queryInterface.removeColumn('PendingBrands', 'status')
    ]);

    // Drop the enum types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_pending_cigars_status";
      DROP TYPE IF EXISTS "enum_pending_brands_status";
    `);
  },

  async down(queryInterface, Sequelize) {
    // First recreate the enum types
    await Promise.all([
      queryInterface.sequelize.query(`
        CREATE TYPE "enum_pending_cigars_status" AS ENUM ('pending', 'approved', 'declined');
      `),
      queryInterface.sequelize.query(`
        CREATE TYPE "enum_pending_brands_status" AS ENUM ('pending', 'approved', 'declined');
      `)
    ]);

    // Add back the status columns
    await Promise.all([
      queryInterface.addColumn('PendingCigars', 'status', {
        type: 'enum_pending_cigars_status',
        allowNull: false,
        defaultValue: 'pending'
      }),
      queryInterface.addColumn('PendingBrands', 'status', {
        type: 'enum_pending_brands_status',
        allowNull: false,
        defaultValue: 'pending'
      })
    ]);

    // Recreate the indexes
    await Promise.all([
      queryInterface.addIndex('PendingCigars', ['status', 'submission_date'], {
        name: 'pending_cigar_status_date_idx'
      }),
      queryInterface.addIndex('PendingCigars', ['submitter_id', 'status'], {
        name: 'pending_cigar_submitter_status_idx'
      }),
      queryInterface.addIndex('PendingBrands', ['status', 'submission_date'], {
        name: 'pending_brand_status_date_idx'
      }),
      queryInterface.addIndex('PendingBrands', ['submitter_id', 'status'], {
        name: 'pending_brand_submitter_status_idx'
      })
    ]);
  }
};