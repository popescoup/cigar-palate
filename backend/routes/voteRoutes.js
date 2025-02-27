// routes/voteRoutes.js
const express = require('express');
const router = express.Router();
const { Thread, Reply, Review, Vote, User, sequelize } = require('../models');
const { auth } = require('../middleware/auth');

/**
 * Handles voting on content (threads, replies, and reviews)
 * @param {Model} Model - The Sequelize model (Thread, Reply, or Review)
 * @param {string} voteableType - The type of content being voted on ('thread', 'reply', or 'review')
 * @param {number} id - The ID of the thread, reply, or review
 * @param {number} userId - The ID of the voting user
 * @param {string} voteType - The type of vote ('like' or 'dislike')
 */
async function handleVote(Model, voteableType, id, userId, voteType) {
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();

    // Check if content exists
    const target = await Model.findByPk(id, { transaction });
    if (!target) {
      await transaction.rollback();
      return { error: `${voteableType} not found`, status: 404 };
    }

    console.log('Initial target state:', {
      id: target.id,
      vote_count: target.vote_count,
      type: voteableType
    });

    // Find existing vote or create new one
    const [vote, created] = await Vote.findOrCreate({
      where: {
        voteable_id: id,
        voteable_type: voteableType,
        user_id: userId
      },
      defaults: { vote_type: voteType },
      transaction
    });

    let voteChange = 0;
    let reputationChange = 0;

    if (!created) {
      // Vote exists - handle vote change or removal
      if (vote.vote_type === voteType) {
        // Remove vote if clicking same button (toggle off)
        await vote.destroy({ transaction });
        voteChange = voteType === 'like' ? -1 : 1;
        reputationChange = voteType === 'like' ? -1 : 1; // Reverse the original reputation gain/loss
      } else {
        // Change vote type (e.g., from like to dislike)
        await vote.update({ vote_type: voteType }, { transaction });
        voteChange = voteType === 'like' ? 2 : -2;
        reputationChange = voteType === 'like' ? 2 : -2; // Double the reputation change since we're switching from -1 to +1 or vice versa
      }
    } else {
      // New vote
      voteChange = voteType === 'like' ? 1 : -1;
      reputationChange = voteType === 'like' ? 1 : -1;
    }

    console.log('Vote change:', {
      created,
      voteChange,
      reputationChange,
      voteType
    });

    // Update the total vote count on the content
    await target.increment('vote_count', {
      by: voteChange,
      transaction
    });

    // Update the content owner's reputation
    await User.increment('reputation', {
      by: reputationChange,
      where: { id: target.user_id },
      transaction
    });

    // Commit the transaction
    await transaction.commit();

    // Get updated vote counts
    const voteCounts = await Vote.findAll({
      where: { 
        voteable_id: id, 
        voteable_type: voteableType 
      },
      attributes: [
        'vote_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['vote_type']
    });

    console.log('Vote counts query result:', {
      voteCounts,
      parsedCounts: {
        likes: parseInt(voteCounts.find(v => v.vote_type === 'like')?.get('count') || '0'),
        dislikes: parseInt(voteCounts.find(v => v.vote_type === 'dislike')?.get('count') || '0')
      }
    });

    // Return the updated counts and user's current vote status
    return {
      data: {
        likes: parseInt(voteCounts.find(v => v.vote_type === 'like')?.get('count') || '0'),
        dislikes: parseInt(voteCounts.find(v => v.vote_type === 'dislike')?.get('count') || '0'),
        vote_count: target.vote_count + voteChange,
        userVote: created ? voteType : (vote?.vote_type === voteType ? null : voteType)
      }
    };
  } catch (error) {
    // Ensure transaction is rolled back on error
    if (transaction) await transaction.rollback();
    console.error('Vote handling error:', error);
    throw error;
  }
}

/**
 * Route for voting on threads
 * POST /api/threads/:id/vote
 */
router.post('/threads/:id/vote', auth, async (req, res) => {
  try {
    // Log the incoming vote request
    console.log('Vote request received:', {
      threadId: req.params.id,
      userId: req.user?.userId,
      voteType: req.body.voteType,
      authenticated: !!req.user
    });

    // Verify user is authenticated
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Handle the vote
    const result = await handleVote(
      Thread,
      'thread',
      req.params.id,
      req.user.userId,
      req.body.voteType
    );

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error processing thread vote:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Route for voting on replies
 * POST /api/replies/:id/vote
 */
router.post('/replies/:id/vote', auth, async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Handle the vote
    const result = await handleVote(
      Reply,
      'reply',
      req.params.id,
      req.user.userId,
      req.body.voteType
    );

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error processing reply vote:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Route for voting on reviews
 * POST /api/reviews/:id/vote
 */
router.post('/reviews/:id/vote', auth, async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Handle the vote
    const result = await handleVote(
      Review,
      'review',
      req.params.id,
      req.user.userId,
      req.body.voteType
    );

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error processing review vote:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;