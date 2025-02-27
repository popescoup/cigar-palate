// routes/threadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { Thread, User, Tag, Reply, ThreadTag, Vote, Follow, Notification } = require('../models');
const sequelize = require('../config');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { upload, processAndSaveImage } = require('../config/multerConfig');

// File handling configuration
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
}

const uploadMiddleware = (req, res, next) => {
    upload.single('image')(req, res, async function(err) {
        if (err) {
            return res.status(400).json({
                error: 'File upload failed',
                details: err.message
            });
        }
        
        try {
            if (req.file) {
                const processedImage = await processAndSaveImage(
                    req.file,
                    uploadsDir,
                    `thread-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`
                );
                req.processedImage = processedImage;
            }
            next();
        } catch (error) {
            return res.status(400).json({
                error: 'Image processing failed',
                details: error.message
            });
        }
    });
};

// Validation middleware
const threadValidation = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title must be less than 255 characters'),
    body('content')
        .notEmpty().withMessage('Content is required'),
    body('tags')
        .custom((value) => {
            try {
                const tags = typeof value === 'string' ? JSON.parse(value) : value;
                if (!Array.isArray(tags)) {
                    throw new Error('Tags must be an array');
                }
                return true;
            } catch (error) {
                throw new Error('Invalid tags format');
            }
        })
];

// Utility functions
const safeDeleteFile = async (filePath) => {
    try {
        if (filePath) {
            const fullPath = filePath.startsWith('/') ? filePath : path.join(process.cwd(), filePath);
            await fsPromises.access(fullPath);
            await fsPromises.unlink(fullPath);
        }
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
    }
};

const getTrendingThreads = async (limit = null, page = null, itemsPerPage = null) => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  
    const queryOptions = {
      attributes: [
        'id',
        'title',
        'content',
        'user_id',
        'created_at',
        'updated_at',
        'vote_count',
        'reply_count',  // Add reply_count to attributes
        'image_path',
        [
          sequelize.literal(`(
            SELECT COUNT(*)::integer 
            FROM "Votes" 
            WHERE "Votes"."voteable_id" = "Thread"."id" 
            AND "Votes"."voteable_type" = 'thread'
            AND "Votes"."created_at" >= '${threeDaysAgo.toISOString()}'
          )`),
          'recentVotesCount'
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*)::integer 
            FROM "Replies" 
            WHERE "Replies"."thread_id" = "Thread"."id" 
            AND "Replies"."created_at" >= '${threeDaysAgo.toISOString()}'
          )`),
          'recentRepliesCount'
        ]
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'reputation']
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        },
        {
          model: Vote,
          as: 'votes',
          attributes: ['vote_type', 'user_id'],
          required: false,
          where: {
            voteable_type: 'thread'
          }
        }
      ],
      order: [
        [
          sequelize.literal(`(
            (SELECT COUNT(*) FROM "Votes" 
             WHERE "Votes"."voteable_id" = "Thread"."id" 
             AND "Votes"."voteable_type" = 'thread'
             AND "Votes"."created_at" >= '${threeDaysAgo.toISOString()}') +
            (SELECT COUNT(*) FROM "Replies" 
             WHERE "Replies"."thread_id" = "Thread"."id" 
             AND "Replies"."created_at" >= '${threeDaysAgo.toISOString()}')
          )`),
          'DESC'
        ],
        ['created_at', 'DESC']
      ]
    };
  
    if (limit) {
      queryOptions.limit = limit;
    }
  
    if (page && itemsPerPage) {
      queryOptions.offset = (page - 1) * itemsPerPage;
      queryOptions.limit = itemsPerPage;
  
      const totalCount = await Thread.count({
        distinct: true,
        include: queryOptions.include
      });
  
      const threads = await Thread.findAll(queryOptions);
  
      const processedThreads = threads.map(thread => {
        const threadJson = thread.toJSON();
        const votes = threadJson.votes || [];
        
        return {
          ...threadJson,
          likes: votes.filter(vote => vote.vote_type === 'like').length,
          dislikes: votes.filter(vote => vote.vote_type === 'dislike').length,
          totalRecentInteractions: threadJson.recentVotesCount + threadJson.recentRepliesCount,
          replyCount: threadJson.reply_count, // Map reply_count to replyCount
          votes: undefined
        };
      });
  
      return {
        threads: processedThreads,
        currentPage: page,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        totalThreads: totalCount
      };
    } else {
      const threads = await Thread.findAll(queryOptions);
      
      return threads.map(thread => {
        const threadJson = thread.toJSON();
        const votes = threadJson.votes || [];
        
        return {
          ...threadJson,
          likes: votes.filter(vote => vote.vote_type === 'like').length,
          dislikes: votes.filter(vote => vote.vote_type === 'dislike').length,
          totalRecentInteractions: threadJson.recentVotesCount + threadJson.recentRepliesCount,
          replyCount: threadJson.reply_count, // Map reply_count to replyCount
          votes: undefined
        };
      });
    }
};

const getThreads = async (sortBy = 'trending', page = 1, limit = 10, userId = null) => {
    if (sortBy === 'trending') {
      return getTrendingThreads(null, page, limit);
    }
  
    const queryOptions = {
      attributes: [
        'id',
        'title',
        'content',
        'user_id',
        'created_at',
        'updated_at',
        'vote_count',
        'reply_count',  // Add reply_count to attributes
        'image_path'
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'reputation']
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        },
        {
          model: Vote,
          as: 'votes',
          attributes: ['vote_type', 'user_id'],
          required: false,
          where: {
            voteable_type: 'thread'
          }
        }
      ],
      limit,
      offset: (page - 1) * limit,
      order: []
    };
  
    switch (sortBy) {
      case 'newest':
        queryOptions.order.push(['created_at', 'DESC']);
        break;
      case 'most-liked':
        queryOptions.order.push(['vote_count', 'DESC'], ['created_at', 'DESC']);
        break;
      case 'most-disliked':
        queryOptions.order.push(['vote_count', 'ASC'], ['created_at', 'DESC']);
        break;
      default:
        return getTrendingThreads(null, page, limit);
    }
  
    const { count, rows: threads } = await Thread.findAndCountAll(queryOptions);
  
    const processedThreads = threads.map(thread => {
      const threadJson = thread.toJSON();
      const threadVotes = threadJson.votes || [];
      
      return {
        ...threadJson,
        likes: threadVotes.filter(vote => vote.vote_type === 'like').length,
        dislikes: threadVotes.filter(vote => vote.vote_type === 'dislike').length,
        userVote: userId ? threadVotes.find(vote => vote.user_id === userId)?.vote_type || null : null,
        replyCount: threadJson.reply_count, // Map reply_count to replyCount
        votes: undefined
      };
    });
  
    return {
      threads: processedThreads,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalThreads: count
    };
};

const recalculateThreadVoteCounts = async (threadId = null) => {
    const transaction = await sequelize.transaction();
    try {
      // Build the where clause based on whether a specific threadId is provided
      const whereClause = {
        voteable_type: 'thread'
      };
      if (threadId) {
        whereClause.voteable_id = threadId;
      }
  
      // Get vote counts from Votes table
      const voteCounts = await Vote.findAll({
        where: whereClause,
        attributes: [
          'voteable_id',
          [
            sequelize.literal(`
              SUM(CASE 
                WHEN vote_type = 'like' THEN 1 
                WHEN vote_type = 'dislike' THEN -1 
                ELSE 0 
              END)
            `),
            'vote_count'
          ]
        ],
        group: ['voteable_id']
      });
  
      // Update threads with recalculated vote counts
      for (const voteCount of voteCounts) {
        await Thread.update(
          { vote_count: voteCount.get('vote_count') },
          { 
            where: { id: voteCount.voteable_id },
            transaction
          }
        );
      }
  
      await transaction.commit();
      return {
        success: true,
        threadsUpdated: voteCounts.length
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

// Routes

// Basic thread routes
router.get('/', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || 'newest';
      const userId = req.user?.userId;
  
      const result = await getThreads(sortBy, page, limit, userId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching threads:', error);
      res.status(500).json({ error: 'Server error' });
    }
});

// Create new thread
router.post('/', [auth, uploadMiddleware, threadValidation], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.processedImage?.path) {
            await safeDeleteFile(path.join(uploadsDir, req.processedImage.path));
        }
        return res.status(400).json({ errors: errors.array() });
    }

    let parsedTags = [];
    try {
        parsedTags = typeof req.body.tags === 'string' 
            ? JSON.parse(req.body.tags) 
            : req.body.tags;
    } catch (e) {
        parsedTags = [];
    }

    const transaction = await sequelize.transaction();

    try {
        const imagePath = req.processedImage?.path ? path.join('uploads', req.processedImage.path) : null;

        const thread = await Thread.create({
            title: req.body.title,
            content: req.body.content,
            image_path: imagePath,
            user_id: req.user.userId,
            vote_count: 1
        }, { transaction });

        await Vote.create({
            user_id: req.user.userId,
            voteable_id: thread.id,
            voteable_type: 'thread',
            vote_type: 'like'
        }, { transaction });

        if (parsedTags.length > 0) {
            const tagPromises = parsedTags.map(async (tagName) => {
                const [tag] = await Tag.findOrCreate({
                    where: { name: tagName.toLowerCase().trim() },
                    transaction
                });
                return tag;
            });

            const createdTags = await Promise.all(tagPromises);
            await thread.setTags(createdTags, { transaction });
        }

        // Find all followers of the thread creator
        const followers = await Follow.findAll({
            where: { following_id: req.user.userId },
            attributes: ['follower_id'],
            transaction
        });

        // Create notifications for all followers
        await Promise.all(followers.map(follow => 
            Notification.create({
                user_id: follow.follower_id,
                type: 'thread',
                actor_id: req.user.userId,
                reference_id: thread.id,
                read: false
            }, { transaction })
        ));

        await transaction.commit();

        const completeThread = await Thread.findByPk(thread.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'reputation']
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                }
            ]
        });

        res.status(201).json({
            ...completeThread.toJSON(),
            likes: 1,
            dislikes: 0,
            vote_count: 1,
            userVote: 'like'
        });
    } catch (err) {
        await transaction.rollback();
        if (req.processedImage?.path) {
            await safeDeleteFile(path.join(uploadsDir, req.processedImage.path));
        }
        console.error('Error creating thread:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get trending threads (paginated)
router.get('/trending/all', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = parseInt(req.query.limit) || 21;
        
        const result = await getTrendingThreads(null, page, itemsPerPage);
        
        res.json({
            threads: result.threads,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalThreads: result.totalThreads
        });
    } catch (error) {
        console.error('Error fetching trending threads:', error);
        res.status(500).json({ error: 'Failed to fetch trending threads', details: error.message });
    }
});

// Get top trending threads (limited)
router.get('/trending', async (req, res) => {
    try {
        const trendingThreads = await getTrendingThreads(10);
        res.json(trendingThreads);
    } catch (error) {
        console.error('Error fetching trending threads:', error);
        res.status(500).json({ error: 'Failed to fetch trending threads', details: error.message });
    }
});

// Get single thread
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.userId;
        
        const thread = await Thread.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'reputation']
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                },
                {
                    model: Vote,
                    as: 'votes',
                    attributes: ['vote_type', 'user_id'],
                    required: false,
                    where: {
                        voteable_type: 'thread'
                    }
                }
            ]
        });

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        const replies = await Reply.findAll({
            where: { thread_id: req.params.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'reputation']
                },
                {
                    model: Vote,
                    as: 'votes',
                    attributes: ['vote_type', 'user_id'],
                    required: false,
                    where: {
                        voteable_type: 'reply'
                    }
                }
            ],
            order: [['created_at', 'ASC']]
        });

        const threadJson = thread.toJSON();
        const threadVotes = threadJson.votes || [];
        
        const replyMap = new Map();

        replies.forEach(reply => {
            const replyJson = reply.toJSON();
            const replyVotes = replyJson.votes || [];
            
            replyMap.set(reply.id, {
                ...replyJson,
                likes: replyVotes.filter(vote => vote.vote_type === 'like').length,
                dislikes: replyVotes.filter(vote => vote.vote_type === 'dislike').length,
                userVote: userId ? replyVotes.find(vote => vote.user_id === userId)?.vote_type || null : null,
                votes: undefined,
                children: []
            });
        });

        const topLevelReplies = [];
        replies.forEach(reply => {
            const replyData = replyMap.get(reply.id);
            if (reply.parent_id === null) {
                topLevelReplies.push(replyData);
            } else {
                const parentReply = replyMap.get(reply.parent_id);
                if (parentReply) {
                    parentReply.children.push(replyData);
                }
            }
        });

        const processedThread = {
            ...threadJson,
            likes: threadVotes.filter(vote => vote.vote_type === 'like').length,
            dislikes: threadVotes.filter(vote => vote.vote_type === 'dislike').length,
            userVote: userId ? threadVotes.find(vote => vote.user_id === userId)?.vote_type || null : null,
            votes: undefined,
            replies: topLevelReplies
        };

        res.json(processedThread);
    } catch (error) {
        console.error('Error fetching thread:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update thread
router.put('/:id', [auth, uploadMiddleware], async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const thread = await Thread.findByPk(req.params.id);
        
        if (!thread) {
            if (req.processedImage?.path) {
                await safeDeleteFile(path.join(uploadsDir, req.processedImage.path));
            }
            await transaction.rollback();
            return res.status(404).json({ error: 'Thread not found' });
        }

        if (thread.user_id !== req.user.userId) {
            if (req.processedImage?.path) {
                await safeDeleteFile(path.join(uploadsDir, req.processedImage.path));
            }
            await transaction.rollback();
            return res.status(403).json({ error: 'Not authorized to update this thread' });
        }

        const oldImagePath = thread.image_path;

        let newImagePath;
if (req.processedImage?.path) {
    newImagePath = path.join('uploads', req.processedImage.path);
} else if (req.body.removeImage === 'true') {
    newImagePath = null;
} else {
    newImagePath = oldImagePath;
}

        let parsedTags = [];
        if (req.body.tags) {
            try {
                parsedTags = typeof req.body.tags === 'string' 
                    ? JSON.parse(req.body.tags) 
                    : req.body.tags;
            } catch (error) {
                parsedTags = [];
            }
        }

        await thread.update({
            title: req.body.title || thread.title,
            content: req.body.content || thread.content,
            image_path: newImagePath
        }, { transaction });

        if (parsedTags.length > 0) {
            const tagPromises = parsedTags.map(async (tagName) => {
                const [tag] = await Tag.findOrCreate({
                    where: { name: tagName.toLowerCase().trim() },
                    transaction
                });
                return tag;
            });

            const updatedTags = await Promise.all(tagPromises);
            await thread.setTags(updatedTags, { transaction });
        }

        if ((req.processedImage?.path || req.body.removeImage === 'true') && oldImagePath) {
            await safeDeleteFile(path.join(uploadsDir, oldImagePath));
        }

        await transaction.commit();

        const updatedThread = await Thread.findByPk(thread.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'reputation']
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                },
                {
                    model: Vote,
                    as: 'votes',
                    attributes: ['vote_type', 'user_id'],
                    required: false,
                    where: {
                        voteable_type: 'thread'
                    }
                }
            ]
        });

        const threadJson = updatedThread.toJSON();
        const votes = threadJson.votes || [];
        
        res.json({
            ...threadJson,
            likes: votes.filter(vote => vote.vote_type === 'like').length,
            dislikes: votes.filter(vote => vote.vote_type === 'dislike').length,
            userVote: votes.find(vote => vote.user_id === req.user.userId)?.vote_type || null,
            votes: undefined
        });
    } catch (err) {
        await transaction.rollback();
        if (req.processedImage?.path) {
            await safeDeleteFile(path.join(uploadsDir, req.processedImage.path));
        }
        console.error('Error updating thread:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Delete thread
router.delete('/:id', auth, async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const thread = await Thread.findByPk(req.params.id);
        
        if (!thread) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Thread not found' });
        }

        if (thread.user_id !== req.user.userId) {
            await transaction.rollback();
            return res.status(403).json({ error: 'Not authorized to delete this thread' });
        }

        // Find all replies to calculate reputation changes
        const replies = await Reply.findAll({
            where: { thread_id: thread.id },
            include: [{
                model: Vote,
                as: 'votes',
                where: { voteable_type: 'reply' },
                required: false
            }],
            transaction
        });

        // Calculate and update reputation for users who had replies
        for (const reply of replies) {
            if (reply.votes && reply.votes.length > 0) {
                const reputationChange = reply.votes.reduce((acc, vote) => {
                    return acc + (vote.vote_type === 'like' ? -1 : 1);
                }, 0);
                
                await User.increment('reputation', {
                    by: reputationChange,
                    where: { id: reply.user_id },
                    transaction
                });
            }
        }

        // Calculate and update reputation for thread owner from thread votes
        const threadVotes = await Vote.count({
            where: {
                voteable_id: thread.id,
                voteable_type: 'thread',
                vote_type: 'like'
            },
            transaction
        });

        await User.increment('reputation', {
            by: -threadVotes,
            where: { id: thread.user_id },
            transaction
        });

        // Delete all votes for the thread and its replies
        await Vote.destroy({
            where: {
                [Op.or]: [
                    { voteable_id: thread.id, voteable_type: 'thread' },
                    { 
                        voteable_id: { [Op.in]: replies.map(r => r.id) },
                        voteable_type: 'reply'
                    }
                ]
            },
            transaction
        });

        // Delete all replies
        await Reply.destroy({
            where: { thread_id: thread.id },
            transaction
        });

        // Delete the thread's image if it exists
        const imagePath = thread.image_path;
        if (imagePath) {
            await safeDeleteFile(path.join(uploadsDir, imagePath));
        }

        // Finally delete the thread
        await thread.destroy({ transaction });

        await transaction.commit();
        res.json({ 
            message: 'Thread and all associated replies deleted successfully',
            deletedReplies: replies.length
        });
    } catch (err) {
        await transaction.rollback();
        console.error('Error deleting thread:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File upload failed',
                details: 'File size cannot exceed 3.5MB'  // Updated to match new limit
            });
        }
        return res.status(400).json({
            error: 'File upload failed',
            details: err.message
        });
    } else if (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({
            error: 'Server error',
            details: 'An unexpected error occurred while processing your request'
        });
    }
    next();
});

// Recalculate votes for a specific thread
router.post('/threads/:id/recalculate-votes', auth, async (req, res) => {
    try {
      const result = await recalculateThreadVoteCounts(req.params.id);
      res.json({ message: 'Vote count recalculated successfully', ...result });
    } catch (error) {
      console.error('Error recalculating vote count:', error);
      res.status(500).json({ error: 'Failed to recalculate vote count' });
    }
  });
  
  // Recalculate votes for all threads
  router.post('/threads/recalculate-all-votes', auth, async (req, res) => {
    try {
      const result = await recalculateThreadVoteCounts();
      res.json({ message: 'All vote counts recalculated successfully', ...result });
    } catch (error) {
      console.error('Error recalculating vote counts:', error);
      res.status(500).json({ error: 'Failed to recalculate vote counts' });
    }
  });

module.exports = router;