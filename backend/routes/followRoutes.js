// routes/followRoutes.js
const express = require('express');
const router = express.Router();
const { User, Follow, Thread, Reply, Review, Notification } = require('../models');
const { auth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Follow a user
router.post('/follow/:userId', auth, async (req, res) => {
    try {
      const follower_id = req.user.userId;
      const following_id = parseInt(req.params.userId);
  
      if (follower_id === following_id) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
  
      const [follow, created] = await Follow.findOrCreate({
        where: { follower_id, following_id }
      });
  
      if (!created) {
        return res.status(400).json({ message: "Already following this user" });
      }

      // Create notification for the user being followed
      await Notification.create({
        user_id: following_id,      // Person being followed receives the notification
        type: 'follow',
        actor_id: follower_id,      // Person who initiated the follow
        reference_id: following_id,  // ID of the user being followed
        read: false
      });

      res.json({ message: "Successfully followed user" });
    } catch (error) {
      console.error('Follow error:', error);
      res.status(500).json({ message: "Server error" });
    }
});

// Unfollow a user
router.delete('/follow/:userId', auth, async (req, res) => {
    try {
      const follower_id = req.user.userId;
      const following_id = parseInt(req.params.userId);
  
      const deleted = await Follow.destroy({
        where: { follower_id, following_id }
      });

    if (!deleted) {
      return res.status(400).json({ message: "Not following this user" });
    }

    res.json({ message: "Successfully unfollowed user" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's feed (activity from followed users)
router.get('/feed', auth, async (req, res) => {
  try {
    const followedUsers = await Follow.findAll({
      where: { follower_id: req.user.id },
      attributes: ['following_id']
    });

    const followedUserIds = followedUsers.map(f => f.following_id);

    const [threads, replies, reviews] = await Promise.all([
      Thread.findAll({
        where: { userId: followedUserIds },
        include: [{ model: User, attributes: ['username'] }],
        order: [['created_at', 'DESC']],
        limit: 50
      }),
      Reply.findAll({
        where: { userId: followedUserIds },
        include: [
          { model: User, attributes: ['username'] },
          { model: Thread, attributes: ['id', 'title'] }
        ],
        order: [['created_at', 'DESC']],
        limit: 50
      }),
      Review.findAll({
        where: { userId: followedUserIds },
        include: [
          { model: User, attributes: ['username'] },
          { 
            model: Cigar,
            attributes: ['id', 'name'],
            include: [{ model: Brand, attributes: ['name'] }]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 50
      })
    ]);

    // Combine and sort activities
    const activities = [
      ...threads.map(t => ({ 
        type: 'thread',
        data: t,
        created_at: t.created_at
      })),
      ...replies.map(r => ({
        type: 'reply',
        data: r,
        created_at: r.created_at
      })),
      ...reviews.map(r => ({
        type: 'review',
        data: r,
        created_at: r.created_at
      }))
    ].sort((a, b) => b.created_at - a.created_at)
     .slice(0, 50);

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { username: req.params.username },
      attributes: ['id', 'username', 'reputation', 'bio', 'created_at'],
      include: [
        {
          model: User,
          as: 'followers',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'following',
          attributes: ['id'],
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for authenticated user from token
    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Add some debug logging
        console.log('Token decoded:', { 
          decodedUserId: decoded.userId, 
          targetUserId: user.id 
        });
        
        const isFollowing = await Follow.findOne({
          where: {
            follower_id: decoded.userId,
            following_id: user.id
          }
        });
        console.log('Follow status:', { isFollowing: !!isFollowing });
        
        user.dataValues.isFollowing = !!isFollowing;
      } catch (error) {
        console.error('Token verification error:', error);
        user.dataValues.isFollowing = false;
      }
    } else {
      user.dataValues.isFollowing = false;
    }

    res.json(user);
  } catch (error) {
    console.error('Profile route error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's followers with pagination
router.get('/:username/followers', auth, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
  
      const targetUser = await User.findOne({
        where: { username: req.params.username }
      });
  
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const followers = await User.findAndCountAll({
        include: [{
          model: User,
          as: 'following',
          where: { id: targetUser.id },
          attributes: [],
          through: { attributes: [] }
        }],
        attributes: ['id', 'username'],
        limit,
        offset,
        subQuery: false
      });
  
      // Add isFollowing flag if there's an authenticated user
      if (req.user) {
        const userFollowing = await Follow.findAll({
          where: { follower_id: req.user.userId },
          attributes: ['following_id']
        });
        
        const followingIds = new Set(userFollowing.map(f => f.following_id));
        followers.rows.forEach(follower => {
          follower.dataValues.isFollowing = followingIds.has(follower.id);
        });
      }
  
      res.json({
        users: followers.rows,
        currentPage: page,
        totalPages: Math.ceil(followers.count / limit),
        hasMore: offset + followers.rows.length < followers.count
      });
    } catch (error) {
        console.error('Followers fetch error:', error);
        res.status(500).json({ 
          message: "Server error",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });

  // Get users being followed with pagination
  router.get('/:username/following', auth, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
  
      const targetUser = await User.findOne({
        where: { username: req.params.username }
      });
  
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const following = await User.findAndCountAll({
        include: [{
          model: User,
          as: 'followers',
          where: { id: targetUser.id },
          attributes: [],
          through: { attributes: [] }
        }],
        attributes: ['id', 'username'],
        limit,
        offset,
        subQuery: false
      });
  
      // Add isFollowing flag if there's an authenticated user
      if (req.user) {
        const userFollowing = await Follow.findAll({
          where: { follower_id: req.user.userId },
          attributes: ['following_id']
        });
        
        const followingIds = new Set(userFollowing.map(f => f.following_id));
        following.rows.forEach(user => {
          user.dataValues.isFollowing = followingIds.has(user.id);
        });
      }
  
      res.json({
        users: following.rows,
        currentPage: page,
        totalPages: Math.ceil(following.count / limit),
        hasMore: offset + following.rows.length < following.count
      });
    } catch (error) {
      console.error('Error fetching following:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

module.exports = router;