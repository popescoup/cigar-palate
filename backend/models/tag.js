// models/tag.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['name'],
    },
  ],
});

module.exports = Tag;