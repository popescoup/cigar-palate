// jobs/tokenCleanup.js
const cron = require('node-cron');
const { User } = require('../models');
const { Op } = require('sequelize');

const cleanupTokens = async () => {
  try {
    // Clean up expired verification tokens
    await User.update(
      {
        verificationToken: null,
        verificationExpiry: null
      },
      {
        where: {
          verificationExpiry: {
            [Op.lt]: new Date()
          },
          verificationToken: {
            [Op.ne]: null
          }
        }
      }
    );

    // Clean up expired reset tokens
    await User.update(
      {
        resetToken: null,
        resetTokenExpiry: null
      },
      {
        where: {
          resetTokenExpiry: {
            [Op.lt]: new Date()
          },
          resetToken: {
            [Op.ne]: null
          }
        }
      }
    );

    console.log('Token cleanup completed successfully');
  } catch (error) {
    console.error('Token cleanup failed:', error);
  }
};

// Run cleanup job every day at midnight
const scheduleTokenCleanup = () => {
  cron.schedule('0 0 * * *', cleanupTokens);
};

module.exports = {
  cleanupTokens,
  scheduleTokenCleanup
};