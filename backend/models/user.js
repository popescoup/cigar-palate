// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const crypto = require('crypto');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Changed to true to support social login
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  reputation: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  bookmark_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    index: true
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verificationExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  acceptsEmails: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  bio: {
    type: DataTypes.STRING(140),
    allowNull: true,
    defaultValue: null
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  facebookId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  socialAvatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['username'],
    },
    {
      fields: ['isAdmin']
    },
    {
      fields: ['reputation']
    },
    {
      fields: ['bookmark_count']
    },
    {
      fields: ['resetToken']
    },
    {
      fields: ['isVerified']
    },
    {
      fields: ['verificationToken']
    },
    {
      fields: ['acceptsEmails']
    },
    {
      fields: ['googleId']
    },
    {
      fields: ['facebookId']
    },
    {
      fields: ['metadata']
    }
  ],
});

// Instance methods for password reset
User.prototype.generatePasswordResetToken = async function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetToken = hashedToken;
  this.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
  
  await this.save();
  
  return resetToken;
};

User.prototype.verifyPasswordResetToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return (
    this.resetToken === hashedToken &&
    this.resetTokenExpiry > new Date()
  );
};

// Instance methods for email verification
User.prototype.generateVerificationToken = async function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  const hashedToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.verificationToken = hashedToken;
  this.verificationExpiry = new Date(Date.now() + 86400000); // 24 hour expiry
  
  await this.save();
  
  return verificationToken;
};

User.prototype.verifyEmailToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return (
    this.verificationToken === hashedToken &&
    this.verificationExpiry > new Date()
  );
};

module.exports = User;