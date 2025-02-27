// backend/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { Review, Cigar, User, Vote, Follow, Notification } = require('../models');
const sequelize = require('../config'); 
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const PAGE_SIZE = 25;

const getTotalDescendantCount = async (reviewId, t) => {
  const descendants = await Review.count({
    where: {
      [Op.or]: [
        { parent_id: reviewId },
        {
          path: {
            [Op.like]: `%${reviewId}%`
          }
        }
      ]
    },
    transaction: t
  });
  return descendants;
};

// For getting deeper highlighted reviews
router.get('/cigars/:cigarId/review-page/:reviewId', async (req, res) => {
  try {
    const { cigarId, reviewId } = req.params;
    const filter = req.query.filter || 'mostLiked';

    // First verify the review exists and belongs to this cigar
    const review = await Review.findOne({
      where: { 
        id: reviewId,
        cigar_id: cigarId
      }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // If this is a nested reply, we need to find its root parent
    let rootParentId = review.parent_id;
    let rootParent = null;
    if (rootParentId) {
      let currentParent = await Review.findByPk(rootParentId);
      while (currentParent && currentParent.parent_id) {
        rootParentId = currentParent.parent_id;
        currentParent = await Review.findByPk(currentParent.parent_id);
      }
      rootParent = currentParent;
    }

    // Build the where clause based on the filter
    const getWhereClause = (baseReview) => {
      const baseWhere = {
        cigar_id: cigarId,
        parent_id: null
      };

      switch (filter) {
        case 'mostLiked':
          return {
            ...baseWhere,
            vote_count: { [Op.gt]: baseReview.vote_count }
          };
        case 'mostDisliked':
          return {
            ...baseWhere,
            vote_count: { [Op.lt]: baseReview.vote_count }
          };
        case 'oldest':
          return {
            ...baseWhere,
            created_at: { [Op.lt]: baseReview.created_at }
          };
        case 'newest':
          return {
            ...baseWhere,
            created_at: { [Op.gt]: baseReview.created_at }
          };
        default:
          return baseWhere;
      }
    };

    // Count reviews before this one based on the filter
    const countBefore = await Review.count({
      where: getWhereClause(rootParent || review)
    });

    // Calculate the page number (0-based)
    const page = Math.floor(countBefore / PAGE_SIZE);

    res.json({ page });
  } catch (err) {
    console.error('Error finding review page:', err);
    res.status(500).json({ error: 'Failed to find review page', details: err.message });
  }
});

// Route to add a review or reply (authentication required)
router.post('/cigars/:id/reviews', auth, async (req, res) => {
  const t = await Review.sequelize.transaction();
  try {
    const { comment, parentId } = req.body;
    const cigarId = req.params.id;
    const userId = req.user.userId;

    console.log('Creating review/reply with:', {
      comment,
      cigarId,
      userId,
      parentId,
      user: req.user
    });

    // Verify that the user exists
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    const cigar = await Cigar.findByPk(cigarId, { transaction: t });
    if (!cigar) {
      await t.rollback();
      return res.status(404).json({ error: 'Cigar not found' });
    }

    // If this is a reply, verify parent exists and check depth
    let parentReview = null;
    if (parentId) {
      parentReview = await Review.findByPk(parentId, { transaction: t });
      if (!parentReview) {
        await t.rollback();
        return res.status(404).json({ error: 'Parent review not found' });
      }
      
      if (parentReview.depth >= 3) {
        await t.rollback();
        return res.status(400).json({ error: 'Maximum reply depth exceeded' });
      }
    }

    // Create the review
    const review = await Review.create({
      comment,
      cigar_id: cigarId,
      user_id: userId,
      parent_id: parentId || null,
      vote_count: 1  // Initialize with 1 for the initial vote
    }, { transaction: t });

    // Create the initial vote record
    await Vote.create({
      user_id: userId,
      voteable_id: review.id,
      voteable_type: 'review',
      vote_type: 'like'
    }, { transaction: t });

    // Add reputation for the automatic upvote
    await User.increment('reputation', {
      by: 1,
      where: { id: userId },
      transaction: t
    });

    // Handle notifications based on whether this is a new review or a reply
    if (parentId) {
      // This is a reply - create notifications for:
      // 1. The author of the parent review (if it's not the same user)
      // 2. Followers of the user making the reply
      
      const notificationPromises = [];

      // 1. Notify the author of the parent review
      if (parentReview.user_id !== userId) {
        notificationPromises.push(
          Notification.create({
            user_id: parentReview.user_id,
            type: 'review_reply',
            actor_id: userId,
            reference_id: review.id,
            read: false
          }, { transaction: t })
        );
      }

      // 2. Get followers and notify them about the reply
      const followers = await Follow.findAll({
        where: { following_id: userId },
        attributes: ['follower_id'],
        transaction: t
      });

      // Create notifications for followers (excluding the parent review author to avoid duplicate)
      followers.forEach(follow => {
        if (follow.follower_id !== parentReview.user_id) {
          notificationPromises.push(
            Notification.create({
              user_id: follow.follower_id,
              type: 'review_reply',
              actor_id: userId,
              reference_id: review.id,
              read: false
            }, { transaction: t })
          );
        }
      });

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);

    } else {
      // This is a new review - notify followers as before
      const followers = await Follow.findAll({
        where: { following_id: userId },
        attributes: ['follower_id'],
        transaction: t
      });

      const notificationPromises = followers.map(follow => 
        Notification.create({
          user_id: follow.follower_id,
          type: 'review',
          actor_id: userId,
          reference_id: review.id,
          read: false
        }, { transaction: t })
      );

      await Promise.all(notificationPromises);
    }

    console.log('Review/reply created:', {
      reviewData: review.toJSON(),
      initialVote: {
        user_id: userId,
        voteable_id: review.id,
        vote_type: 'like'
      }
    });

    await t.commit();

    // Include the vote information in the response
    res.status(201).json({
      ...review.toJSON(),
      user: {
        id: user.id,
        username: user.username,
        reputation: user.reputation
      },
      likes: 1,
      dislikes: 0,
      vote_count: 1,
      userVote: 'like',
      replies: [],
      reply_count: 0
    });
  } catch (err) {
    await t.rollback();
    console.error('Error creating review/reply:', err);
    res.status(500).json({ error: 'Failed to create review/reply', details: err.message });
  }
});

// Route to get reviews for a specific cigar with filtering
router.get('/cigars/:id/reviews', async (req, res) => {
  try {
      const cigarId = req.params.id;
      const filter = req.query.filter || 'newest';
      const userId = req.query.userId;
      const limit = parseInt(req.query.limit) || 25;
      const offset = parseInt(req.query.offset) || 0;
      
      let order;
      let rootReviews;
      let totalReviews;

      // Start a transaction for consistent counting
      const t = await sequelize.transaction();
      
      try {
          switch (filter) {
              case 'oldest':
                  order = [['created_at', 'ASC']];
                  break;
              case 'mostLiked':
                  order = [['vote_count', 'DESC']];
                  break;
              case 'mostDisliked':
                  order = [['vote_count', 'ASC']];
                  break;
              case 'mostDiscussed':
                  // First get all root reviews
                  const allRootReviews = await Review.findAll({
                      where: { 
                          cigar_id: cigarId,
                          parent_id: null
                      },
                      transaction: t
                  });

                  // Calculate total descendants for each root review
                  const reviewsWithCounts = await Promise.all(
                      allRootReviews.map(async (review) => {
                          const totalDescendants = await getTotalDescendantCount(review.id, t);
                          return {
                              ...review.toJSON(),
                              totalDescendants
                          };
                      })
                  );

                  // Sort by total descendants
                  reviewsWithCounts.sort((a, b) => b.totalDescendants - a.totalDescendants);

                  // Apply pagination
                  const paginatedReviews = reviewsWithCounts.slice(offset, offset + limit);
                  const reviewIds = paginatedReviews.map(r => r.id);

                  // Now get the full review data for these IDs
                  rootReviews = await Review.findAll({
                      where: { 
                          id: reviewIds
                      },
                      include: [
                          {
                              model: User,
                              as: 'user',
                              attributes: ['id', 'username', 'reputation'],
                              required: false
                          },
                          {
                              model: Vote,
                              as: 'votes',
                              required: false,
                              where: {
                                  voteable_type: 'review'
                              }
                          }
                      ],
                      order: [
                          [sequelize.literal(`ARRAY_POSITION(ARRAY[${reviewIds.join(',')}]::integer[], "Review"."id")`)]
                      ],
                      transaction: t
                  });

                  totalReviews = allRootReviews.length;
                  break;
              
              case 'newest':
              default:
                  order = [['created_at', 'DESC']];
          }

          // For non-mostDiscussed cases, use regular pagination
          if (filter !== 'mostDiscussed') {
              const result = await Review.findAndCountAll({
                  where: { 
                      cigar_id: cigarId,
                      parent_id: null
                  },
                  include: [
                      {
                          model: User,
                          as: 'user',
                          attributes: ['id', 'username', 'reputation'],
                          required: false
                      },
                      {
                          model: Vote,
                          as: 'votes',
                          required: false,
                          where: {
                              voteable_type: 'review'
                          }
                      }
                  ],
                  order,
                  limit,
                  offset,
                  transaction: t
              });

              rootReviews = result.rows;
              totalReviews = result.count;
          }

          // Get all nested replies for these root reviews
          const nestedReplies = await Review.findAll({
              where: {
                  [Op.or]: rootReviews.map(root => ({
                      [Op.or]: [
                          { parent_id: root.id },  // Direct replies to root review
                          {
                              [Op.and]: [
                                  { cigar_id: cigarId },
                                  { path: { [Op.like]: `${root.id}%` } }  // All descendants of root review
                              ]
                          }
                      ]
                  }))
              },
              include: [
                  {
                      model: User,
                      as: 'user',
                      attributes: ['id', 'username', 'reputation']
                  },
                  {
                      model: Vote,
                      as: 'votes',
                      required: false,
                      where: {
                          voteable_type: 'review'
                      }
                  }
              ],
              order: [['created_at', 'ASC']],
              transaction: t
          });

          // Process reviews and build reply tree
          const processReview = (review) => {
              const reviewData = review.toJSON();
              const reviewVotes = reviewData.votes || [];

              return {
                  ...reviewData,
                  likes: reviewVotes.filter(vote => vote.vote_type === 'like').length,
                  dislikes: reviewVotes.filter(vote => vote.vote_type === 'dislike').length,
                  userVote: userId ? reviewVotes.find(vote => vote.user_id === userId)?.vote_type || null : null,
                  vote_count: reviewVotes.filter(vote => vote.vote_type === 'like').length - 
                          reviewVotes.filter(vote => vote.vote_type === 'dislike').length,
                  votes: undefined
              };
          };

          // Build map of replies by parent_id
          const repliesMap = {};
          nestedReplies.forEach(reply => {
              if (!repliesMap[reply.parent_id]) {
                  repliesMap[reply.parent_id] = [];
              }
              repliesMap[reply.parent_id].push(reply);
          });

          // Build reply tree recursively
          const buildReplyTree = (review) => {
              const processedReview = processReview(review);
              const childReplies = repliesMap[review.id] || [];
              processedReview.replies = childReplies.map(reply => buildReplyTree(reply));
              return processedReview;
          };

          // Format all reviews with their complete reply trees
          const formattedReviews = rootReviews.map(review => buildReplyTree(review));

          await t.commit();

          // Send response
          res.status(200).json({
              reviews: formattedReviews,
              pagination: {
                  total: totalReviews,
                  currentPage: Math.floor(offset / limit) + 1,
                  pageSize: limit,
                  hasMore: offset + limit < totalReviews
              }
          });

      } catch (err) {
          await t.rollback();
          throw err;
      }

  } catch (err) {
      console.error('Error retrieving reviews:', err);
      res.status(500).json({ error: 'Failed to retrieve reviews', details: err.message });
  }
});

// Route to get replies for a specific review
router.get('/reviews/:id/replies', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const parentReview = await Review.findByPk(reviewId);
    if (!parentReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const { rows: replies, count: totalReplies } = await Review.findAndCountAll({
      where: {
        parent_id: reviewId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'reputation'],
          required: false
        }
      ],
      order: [['created_at', 'ASC']],
      limit,
      offset
    });

    // Get vote counts for replies
    const replyIds = replies.map(r => r.id);
    const voteCounts = await Vote.findAll({
      where: { 
        voteable_type: 'review',
        voteable_id: replyIds
      },
      attributes: [
        'voteable_id',
        'vote_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['voteable_id', 'vote_type']
    });

    // Get user votes if userId is provided
    const userVotes = userId ? await Vote.findAll({
      where: {
        voteable_type: 'review',
        voteable_id: replyIds,
        user_id: userId
      }
    }) : [];

    // Create lookup maps
    const voteCountMap = voteCounts.reduce((acc, vc) => {
      const key = `${vc.getDataValue('voteable_id')}-${vc.getDataValue('vote_type')}`;
      acc[key] = parseInt(vc.getDataValue('count'));
      return acc;
    }, {});

    const userVoteMap = userVotes.reduce((acc, uv) => {
      acc[uv.voteable_id] = uv.vote_type;
      return acc;
    }, {});

    const formattedReplies = replies.map(reply => {
      const likes = voteCountMap[`${reply.id}-like`] || 0;
      const dislikes = voteCountMap[`${reply.id}-dislike`] || 0;

      return {
        id: reply.id,
        comment: reply.comment,
        likes,
        dislikes,
        vote_count: likes - dislikes,
        user: reply.user || {
          id: null,
          username: 'Anonymous',
          reputation: 0
        },
        created_at: reply.created_at,
        userVote: userVoteMap[reply.id] || null,
        parent_id: reply.parent_id,
        depth: reply.depth,
        reply_count: reply.reply_count,
        path: reply.path
      };
    });

    res.status(200).json({
      replies: formattedReplies,
      pagination: {
        total: totalReplies,
        currentPage: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasMore: offset + limit < totalReplies
      }
    });

  } catch (err) {
    console.error('Error retrieving replies:', err);
    res.status(500).json({ error: 'Failed to retrieve replies', details: err.message });
  }
});

// Route to edit a review or reply
router.put('/reviews/:id', auth, async (req, res) => {
    const t = await Review.sequelize.transaction();
    try {
      const reviewId = req.params.id;
      const userId = req.user.userId;
      const { comment } = req.body;
  
      // Find the review/reply to edit
      const review = await Review.findOne({
        where: { id: reviewId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'reputation']
        }],
        transaction: t
      });
  
      if (!review) {
        await t.rollback();
        return res.status(404).json({ error: 'Review not found' });
      }
  
      // Check if user is authorized to edit
      if (review.user_id !== userId) {
        await t.rollback();
        return res.status(403).json({ error: 'Not authorized to edit this review' });
      }
  
      // Update the review
      await review.update({
        comment,
        is_edited: true,
        edited_at: new Date()
      }, { transaction: t });
  
      // Get vote counts
      const voteCounts = await Vote.findAll({
        where: { 
          voteable_type: 'review',
          voteable_id: reviewId
        },
        attributes: [
          'vote_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['vote_type'],
        transaction: t
      });
  
      // Get user's vote
      const userVote = await Vote.findOne({
        where: {
          voteable_type: 'review',
          voteable_id: reviewId,
          user_id: userId
        },
        transaction: t
      });
  
      await t.commit();
  
      // Format vote counts
      const likes = voteCounts.find(vc => vc.vote_type === 'like')?.get('count') || 0;
      const dislikes = voteCounts.find(vc => vc.vote_type === 'dislike')?.get('count') || 0;
  
      // Return updated review data
      res.json({
        ...review.toJSON(),
        likes,
        dislikes,
        vote_count: likes - dislikes,
        userVote: userVote?.vote_type || null
      });
  
    } catch (err) {
      await t.rollback();
      console.error('Error editing review:', err);
      res.status(500).json({ error: 'Failed to edit review', details: err.message });
    }
  });
  
  // Route to delete a review or reply
router.delete('/reviews/:id', auth, async (req, res) => {
  let t;
  try {
      t = await Review.sequelize.transaction({
          timeout: 10000 
      });
      
      const reviewId = req.params.id;
      const userId = req.user.userId;

      // Find the review with a lock
      const review = await Review.findOne({
          where: { id: reviewId },
          transaction: t,
          lock: true
      });

      if (!review) {
          await t.rollback();
          return res.status(404).json({ error: 'Review not found' });
      }

      if (review.user_id !== userId) {
          await t.rollback();
          return res.status(403).json({ error: 'Not authorized to delete this review' });
      }

      // Check for replies within the same transaction
      const hasReplies = await Review.count({
          where: { parent_id: reviewId },
          transaction: t
      });

      if (hasReplies > 0) {
          // Soft delete
          await review.update({
              comment: '[deleted]',
              is_deleted: true,
              deleted_at: new Date(),
              is_edited: false,
              edited_at: null
          }, { 
              transaction: t,
              hooks: false // Disable hooks to prevent double updates
          });
      } else {
          // Hard delete
          // First handle associated data
          await Promise.all([
              Vote.destroy({
                  where: {
                      voteable_type: 'review',
                      voteable_id: reviewId
                  },
                  transaction: t
              }),
              Notification.destroy({
                  where: {
                      type: ['review', 'reply', 'review_reply'],
                      reference_id: reviewId
                  },
                  transaction: t
              })
          ]);

          // If this is a reply, update parent's reply count
          if (review.parent_id) {
              await Review.update(
                  { 
                      reply_count: sequelize.literal('reply_count - 1'),
                      updated_at: new Date()
                  },
                  { 
                      where: { id: review.parent_id },
                      transaction: t
                  }
              );
          }

          // Finally delete the review
          await review.destroy({ 
              transaction: t,
              hooks: false // Disable hooks since we handled reply_count manually
          });
      }

      await t.commit();
      
      return res.json({ 
          message: hasReplies ? 'Review marked as deleted' : 'Review deleted successfully',
          deletionType: hasReplies ? 'soft' : 'hard',
          reviewId: review.id
      });

  } catch (err) {
      if (t) {
          try {
              await t.rollback();
          } catch (rollbackErr) {
              console.error('Rollback failed:', rollbackErr);
          }
      }
      console.error('Error deleting review:', {
          error: err.message,
          stack: err.stack
      });
      res.status(500).json({ 
          error: 'Failed to delete review', 
          details: err.message 
      });
  }
});

module.exports = router;