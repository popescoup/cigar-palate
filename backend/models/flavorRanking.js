// backend/models/flavorRanking.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config');  // Import the Sequelize instance

const FlavorRanking = sequelize.define('FlavorRanking', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cigarId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  flavor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalRank: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  voteCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = FlavorRanking;