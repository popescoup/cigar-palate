'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');
    
    const columnsToAdd = {};
    
    if (!columns.googleId) {
      columnsToAdd.googleId = {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      };
    }
    
    if (!columns.facebookId) {
      columnsToAdd.facebookId = {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      };
    }

    if (!columns.socialAvatarUrl) {
      columnsToAdd.socialAvatarUrl = {
        type: Sequelize.STRING,
        allowNull: true
      };
    }

    // Add any missing columns
    for (const [columnName, columnDefinition] of Object.entries(columnsToAdd)) {
      await queryInterface.addColumn('Users', columnName, columnDefinition);
    }

    // Modify password column to allow null
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add indexes if they don't exist
    try {
      await queryInterface.addIndex('Users', ['googleId'], {
        name: 'users_google_id_idx'
      });
    } catch (error) {
      console.log('Index users_google_id_idx might already exist');
    }

    try {
      await queryInterface.addIndex('Users', ['facebookId'], {
        name: 'users_facebook_id_idx'
      });
    } catch (error) {
      console.log('Index users_facebook_id_idx might already exist');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove social login columns
    await queryInterface.removeColumn('Users', 'googleId');
    await queryInterface.removeColumn('Users', 'facebookId');
    await queryInterface.removeColumn('Users', 'socialAvatarUrl');

    // Revert password to not null
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Remove indexes
    await queryInterface.removeIndex('Users', 'users_google_id_idx');
    await queryInterface.removeIndex('Users', 'users_facebook_id_idx');
  }
};