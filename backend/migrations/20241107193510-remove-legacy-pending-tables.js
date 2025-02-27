'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop tables in correct order (respect foreign key constraints)
    // First drop PendingCigars as it might have foreign keys to PendingBrands
    await queryInterface.dropTable('PendingCigars');
    
    // Then drop PendingBrands
    await queryInterface.dropTable('PendingBrands');
  },

  async down(queryInterface, Sequelize) {
    // Recreate the tables in reverse order
    await queryInterface.createTable('PendingBrands', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
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
      submission_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
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
        allowNull: true,
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
  }
};