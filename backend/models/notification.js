// models/notification.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Notification = sequelize.define('Notification', {
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
  type: {
    type: DataTypes.ENUM('follow', 'thread', 'reply', 'review', 'review_reply'),
    allowNull: false
  },
  // For polymorphic association - stores the ID of the related content
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Store the user who triggered the notification (e.g., who followed, who posted)
  actor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['read']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['actor_id']
    }
  ]
});

module.exports = Notification;