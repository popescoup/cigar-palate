// backend/models/rating.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    index: true,
  },
  cigar_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    index: true,
  },
  rating_value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 100,
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    index: true,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'cigar_id'],
      name: 'unique_user_cigar_rating'
    },
    {
      fields: ['created_at'],
      name: 'rating_date_idx'
    }
  ]
});

module.exports = Rating;