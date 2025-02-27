// models/follow.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Follow = sequelize.define('Follow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  follower_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  following_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  underscored: true,  // This tells Sequelize to use snake_case
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'Follows',  // Explicitly set table name
  indexes: [
    {
      unique: true,
      fields: ['follower_id', 'following_id']
    },
    {
      fields: ['follower_id']
    },
    {
      fields: ['following_id']
    }
  ]
});

module.exports = Follow;