// models/ThreadBookmark.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const ThreadBookmark = sequelize.define('ThreadBookmark', {
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
  thread_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Threads',
      key: 'id'
    }
  }
}, {
  tableName: 'ThreadBookmarks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'thread_id']
    }
  ]
});

module.exports = ThreadBookmark;