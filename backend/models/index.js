// models/index.js
const sequelize = require('../config');

const Cigar = require('./cigar');
const Brand = require('./brand');
const Review = require('./review');
const User = require('./user');
const FlavorRanking = require('./flavorRanking');
const Thread = require('./thread');
const Reply = require('./reply');
const Tag = require('./tag');
const ThreadTag = require('./threadTag');
const Vote = require('./vote');
const PendingSubmission = require('./pendingSubmission');
const Bookmark = require('./bookmark');
const Rating = require('./rating');
const ThreadBookmark = require('./threadBookmark');
const Follow = require('./follow');
const Notification = require('./notification');

module.exports = {
  Cigar,
  Brand,
  Review,
  User,
  FlavorRanking,
  Thread,
  Reply,
  Tag,
  ThreadTag,
  Vote,
  PendingSubmission,
  Bookmark,
  Rating,
  ThreadBookmark,
  Follow,
  Notification,  
  sequelize
};