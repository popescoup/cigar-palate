// migrations/YYYYMMDDHHMMSS-add-reputation-to-users.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'reputation', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addIndex('Users', ['reputation'], {
      name: 'users_reputation_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Users', 'users_reputation_idx');
    await queryInterface.removeColumn('Users', 'reputation');
  }
};