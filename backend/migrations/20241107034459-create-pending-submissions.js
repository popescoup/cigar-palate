'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First create the new table
    await queryInterface.createTable('PendingSubmissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // Cigar Details
      cigar_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      image_path: {
        type: Sequelize.STRING,
        allowNull: false
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
      // Brand Details
      brand_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Brands',
          key: 'id'
        }
      },
      new_brand_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // Submission Details
      submitter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      submission_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
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
      queryInterface.addIndex('PendingSubmissions', ['submitter_id']),
      queryInterface.addIndex('PendingSubmissions', ['brand_id']),
      queryInterface.addIndex('PendingSubmissions', ['submission_date']),
      queryInterface.addIndex('PendingSubmissions', ['cigar_name'])
    ]);

    // Migrate existing data
    const [pendingCigars] = await queryInterface.sequelize.query(
      'SELECT * FROM "PendingCigars"'
    );

    if (pendingCigars.length > 0) {
      const submissions = pendingCigars.map(cigar => ({
        cigar_name: cigar.name,
        image_path: cigar.image_path,
        flavors: cigar.flavors,
        shape: cigar.shape,
        size: cigar.size,
        color: cigar.color,
        wrap_type: cigar.wrap_type,
        filler: cigar.filler,
        country_of_origin: cigar.country_of_origin,
        aging: cigar.aging,
        handmade: cigar.handmade,
        description: cigar.description,
        brand_id: cigar.brand_id,
        new_brand_name: cigar.new_brand,
        submitter_id: cigar.submitter_id,
        admin_id: cigar.admin_id,
        admin_notes: cigar.admin_notes,
        submission_date: cigar.submission_date,
        review_date: cigar.review_date,
        created_at: cigar.created_at,
        updated_at: cigar.updated_at
      }));

      if (submissions.length > 0) {
        await queryInterface.bulkInsert('PendingSubmissions', submissions);
      }
    }

    // Drop old tables
    await queryInterface.dropTable('PendingCigars');
    await queryInterface.dropTable('PendingBrands');
  },

  async down(queryInterface, Sequelize) {
    // Recreate the old tables first
    // ... (would need to recreate PendingCigars and PendingBrands tables here)
    // ... (would need to migrate data back)
    // Drop the new table
    await queryInterface.dropTable('PendingSubmissions');
  }
};