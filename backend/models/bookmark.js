// models/Bookmark.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Bookmark = sequelize.define('Bookmark', {
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
  cigar_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Cigars',
      key: 'id'
    }
  }
}, {
  tableName: 'Bookmarks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'cigar_id']
    }
  ]
});

module.exports = Bookmark;