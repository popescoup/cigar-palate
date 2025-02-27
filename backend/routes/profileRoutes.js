// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { 
    Thread, 
    Reply, 
    Review, 
    User, 
    Cigar, 
    Brand, 
    Vote,
    Bookmark,
    ThreadBookmark
} = require('../models');
const { auth } = require('../middleware/auth');

// Get user's threads with pagination
router.get('/threads', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const threads = await Thread.findAndCountAll({
            where: { user_id: req.user.userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['username']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({
            threads: threads.rows,
            currentPage: page,
            totalPages: Math.ceil(threads.count / limit),
            totalThreads: threads.count
        });
    } catch (error) {
        console.error('Error fetching user threads:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/replies', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const replies = await Reply.findAndCountAll({
            where: { 
                user_id: req.user.userId,
                is_deleted: false 
            },
            include: [
                {
                    model: Thread,
                    as: 'thread',  // matches your model association
                    attributes: ['title', 'id']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['username']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({
            replies: replies.rows,
            currentPage: page,
            totalPages: Math.ceil(replies.count / limit),
            totalReplies: replies.count
        });
    } catch (error) {
        console.error('Error fetching user replies:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/reviews', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const reviews = await Review.findAndCountAll({
            where: { user_id: req.user.userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['username']
                },
                {
                    model: Cigar,
                    as: 'cigar',  // matches your model association
                    attributes: ['name', 'id']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({
            reviews: reviews.rows,
            currentPage: page,
            totalPages: Math.ceil(reviews.count / limit),
            totalReviews: reviews.count
        });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's bookmarks with pagination
router.get('/bookmarks', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // First get the total count
        const user = await User.findByPk(req.user.userId);
        const totalCount = await user.countBookmarkedCigars();

        // Then get the paginated cigars
        const bookmarkedCigars = await user.getBookmarkedCigars({
            include: [{
                model: Brand,
                as: 'brand',
                attributes: ['name']
            }],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        res.json({
            bookmarks: bookmarkedCigars,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalBookmarks: totalCount
        });
    } catch (error) {
        console.error('Error fetching user bookmarks:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// OTHER User Profile Routes

// Overview Route for public profile
router.get('/:username/overview', async (req, res) => {
    try {
      const user = await User.findOne({
        where: { username: req.params.username },
        attributes: ['id']
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const [
        threads,
        replies,
        reviews,
        totalThreads,
        totalReplies,
        totalReviews,
        totalBookmarks,
        totalThreadBookmarks
      ] = await Promise.all([
        // Get 5 most recent threads
        Thread.findAll({
          where: { user_id: user.id },
          order: [['created_at', 'DESC']],
          limit: 5,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['username']
            }
          ]
        }),
        // Get 5 most recent replies
        Reply.findAll({
          where: { 
            user_id: user.id,
            is_deleted: false 
          },
          order: [['created_at', 'DESC']],
          limit: 5,
          include: [
            {
              model: Thread,
              as: 'thread',
              attributes: ['title', 'id']
            },
            {
              model: User,
              as: 'user',
              attributes: ['username']
            }
          ]
        }),
        // Get 5 most recent reviews
        Review.findAll({
          where: { user_id: user.id },
          order: [['created_at', 'DESC']],
          limit: 5,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['username']
            },
            {
              model: Cigar,
              as: 'cigar',
              attributes: ['name', 'id'],
              include: [{
                model: Brand,
                as: 'brand',
                attributes: ['name']
              }]
            }
          ]
        }),
        // Get total counts
        Thread.count({ where: { user_id: user.id } }),
        Reply.count({ where: { user_id: user.id, is_deleted: false } }),
        Review.count({ where: { user_id: user.id } }),
        Bookmark.count({ where: { user_id: user.id } }),
        ThreadBookmark.count({ where: { user_id: user.id } })
      ]);
  
      // Combine and sort recent activity
      const recentActivity = [...threads, ...reviews, ...replies]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
  
      res.json({
        recentActivity,
        stats: {
          totalThreads,
          totalReplies,
          totalReviews,
          totalBookmarks,
          totalThreadBookmarks
        }
      });
    } catch (error) {
      console.error('Error fetching user overview:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

// Get another user's threads
router.get('/:username/threads', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const user = await User.findOne({
            where: { username: req.params.username }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const threads = await Thread.findAndCountAll({
            where: { user_id: user.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['username']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({
            threads: threads.rows,
            currentPage: page,
            totalPages: Math.ceil(threads.count / limit),
            totalThreads: threads.count
        });
    } catch (error) {
        console.error('Error fetching user threads:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get another user's replies
router.get('/:username/replies', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const user = await User.findOne({
            where: { username: req.params.username }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const replies = await Reply.findAndCountAll({
            where: { 
                user_id: user.id,
                is_deleted: false 
            },
            include: [
                {
                    model: Thread,
                    as: 'thread',
                    attributes: ['title', 'id']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['username']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({
            replies: replies.rows,
            currentPage: page,
            totalPages: Math.ceil(replies.count / limit),
            totalReplies: replies.count
        });
    } catch (error) {
        console.error('Error fetching user replies:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get another user's reviews
router.get('/:username/reviews', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const user = await User.findOne({
            where: { username: req.params.username }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const reviews = await Review.findAndCountAll({
            where: { user_id: user.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['username']
                },
                {
                    model: Cigar,
                    as: 'cigar',
                    attributes: ['name', 'id'],
                    include: [{
                        model: Brand,
                        as: 'brand',
                        attributes: ['name']
                    }]
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({
            reviews: reviews.rows,
            currentPage: page,
            totalPages: Math.ceil(reviews.count / limit),
            totalReviews: reviews.count
        });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get another user's bookmarks
router.get('/:username/bookmarks', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const user = await User.findOne({
            where: { username: req.params.username }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get total count first
        const totalCount = await user.countBookmarkedCigars();

        // Then get paginated results
        const bookmarkedCigars = await user.getBookmarkedCigars({
            include: [{
                model: Brand,
                as: 'brand',
                attributes: ['name']
            }],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        res.json({
            bookmarks: bookmarkedCigars,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalBookmarks: totalCount
        });
    } catch (error) {
        console.error('Error fetching user bookmarks:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get another user's thread bookmarks
router.get('/:username/thread-bookmarks', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const user = await User.findOne({
            where: { username: req.params.username }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { count, rows: threadBookmarks } = await ThreadBookmark.findAndCountAll({
            where: { user_id: user.id },
            include: [{
                model: Thread,
                as: 'thread',
                attributes: ['id', 'title', 'content'],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['username']
                }]
            }],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        const formattedBookmarks = threadBookmarks.map(bookmark => ({
            id: bookmark.thread.id,
            title: bookmark.thread.title,
            content: bookmark.thread.content,
            username: bookmark.thread.user.username,
            bookmarked_at: bookmark.created_at
        }));

        res.json({
            threads: formattedBookmarks,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalThreadBookmarks: count
        });
    } catch (error) {
        console.error('Error fetching user thread bookmarks:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;