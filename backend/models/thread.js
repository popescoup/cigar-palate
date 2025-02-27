// models/thread.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Thread = sequelize.define('Thread', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image_path: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /\.(jpg|jpeg|png)$/,
      validPath(value) {
        if (value && !value.startsWith('uploads/')) {
          throw new Error('Image path must be in uploads directory');
        }
      }
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  vote_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  reply_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  total_bookmarks: {  // Add this field
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['vote_count'],
    },
    {
      fields: ['reply_count'],
    },
    {
      fields: ['image_path'],
    },
    {
      fields: ['total_bookmarks'],  // Add this index
    }
  ],
});

module.exports = Thread;