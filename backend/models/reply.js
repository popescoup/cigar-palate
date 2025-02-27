// models/reply.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Reply = sequelize.define('Reply', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      // If the reply is deleted, return [Deleted]
      if (this.getDataValue('is_deleted')) {
        return '[Deleted]';
      }
      return this.getDataValue('content');
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
  thread_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Threads',
      key: 'id',
    },
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Replies',
      key: 'id',
    },
  },
  vote_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  has_children: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
      fields: ['thread_id'],
    },
    {
      fields: ['parent_id'],
    },
    {
      fields: ['vote_count'],
    },
    {
      fields: ['is_deleted'],
    }
  ],
});

// Add self-referential association
Reply.belongsTo(Reply, { as: 'parent', foreignKey: 'parent_id' });
Reply.hasMany(Reply, { as: 'children', foreignKey: 'parent_id' });

module.exports = Reply;