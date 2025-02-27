// models/Vote.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Vote = sequelize.define('Vote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  voteable_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  voteable_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vote_type: {
    type: DataTypes.ENUM('like', 'dislike'),
    allowNull: false
  }
}, {
  tableName: 'Votes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'voteable_id', 'voteable_type']
    }
  ]
});

module.exports = Vote;