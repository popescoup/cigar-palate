// routes/threadBookmarkRoutes.js
const express = require('express');
const router = express.Router();
const { Thread, User, ThreadBookmark, Cigar, sequelize } = require('../models');
const { auth } = require('../middleware/auth');

/**
 * Bookmark a thread
 * POST /api/thread-bookmarks/:threadId
 */
router.post('/:threadId', auth, async (req, res) => {
    let transaction;
    
    try {
      transaction = await sequelize.transaction();
  
      // Check if thread exists
      const thread = await Thread.findByPk(req.params.threadId, { transaction });
      if (!thread) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Thread not found' });
      }
  
      // Check if bookmark already exists
      const existingBookmark = await ThreadBookmark.findOne({
        where: {
          user_id: req.user.userId,
          thread_id: req.params.threadId
        },
        transaction
      });
  
      if (existingBookmark) {
        await transaction.rollback();
        return res.status(400).json({ msg: 'Thread already bookmarked' });
      }
  
      // Create bookmark
      await ThreadBookmark.create({
        user_id: req.user.userId,
        thread_id: req.params.threadId
      }, { transaction });
  
      // Increment thread's total_bookmarks - Add this line
      await thread.increment('total_bookmarks', { transaction });
  
      await transaction.commit();
  
      // Get fresh thread data after transaction
      const updatedThread = await Thread.findByPk(req.params.threadId);
  
      res.json({
        msg: 'Thread bookmarked successfully',
        total_bookmarks: updatedThread.total_bookmarks
      });
  
    } catch (err) {
      if (transaction) await transaction.rollback();
      console.error('Error bookmarking thread:', err);
      res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * Remove a thread bookmark
 * DELETE /api/thread-bookmarks/:threadId
 */
router.delete('/:threadId', auth, async (req, res) => {
    let transaction;
  
    try {
      transaction = await sequelize.transaction();
  
      // Check if thread exists
      const thread = await Thread.findByPk(req.params.threadId, { transaction });
      if (!thread) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Thread not found' });
      }
  
      // Find and delete bookmark
      const bookmark = await ThreadBookmark.findOne({
        where: {
          user_id: req.user.userId,
          thread_id: req.params.threadId
        },
        transaction
      });
  
      if (!bookmark) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Bookmark not found' });
      }
  
      await bookmark.destroy({ transaction });
  
      // Decrement thread's total_bookmarks - Add this line
      await thread.decrement('total_bookmarks', { transaction });
  
      await transaction.commit();
  
      // Get fresh thread data after transaction
      const updatedThread = await Thread.findByPk(req.params.threadId);
  
      res.json({
        msg: 'Bookmark removed successfully',
        total_bookmarks: updatedThread.total_bookmarks
      });
  
    } catch (err) {
      if (transaction) await transaction.rollback();
      console.error('Error removing bookmark:', err);
      res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * Get user's bookmarked threads
 * GET /api/thread-bookmarks
 */
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get bookmark records
    const bookmarks = await ThreadBookmark.findAndCountAll({
      where: { user_id: req.user.userId },
      limit,
      offset,
      order: [['created_at', 'DESC']], // Most recent bookmarks first
      include: [{
        model: Thread,
        as: 'thread',
        include: ['tags', 'user'], // Include thread relationships
        attributes: { 
          exclude: ['updated_at'] 
        }
      }]
    });

    const threads = bookmarks.rows.map(bookmark => bookmark.thread);

    res.json({
      threads,
      currentPage: page,
      totalPages: Math.ceil(bookmarks.count / limit),
      totalBookmarks: bookmarks.count
    });

  } catch (err) {
    console.error('Error fetching bookmarked threads:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * Get user's bookmarked threads for profile
 * GET /api/thread-bookmarks/user
 */
router.get('/user', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Update the include statement to specify the alias
    const bookmarks = await ThreadBookmark.findAndCountAll({
      where: { user_id: req.user.userId },
      limit,
      offset,
      order: [['created_at', 'DESC']], 
      include: [{
        model: Thread,
        as: 'thread',  // Add this line - specifies the alias
        attributes: ['id', 'title', 'content'],
        include: [{
          model: User,
          as: 'user',
          attributes: ['username']
        }]
      }]
    });

    // Format the response
    const threads = bookmarks.rows.map(bookmark => ({
      id: bookmark.thread.id,
      title: bookmark.thread.title,
      content: bookmark.thread.content,
      username: bookmark.thread.user.username,
      bookmarked_at: bookmark.created_at
    }));

    res.json({
      threads,
      currentPage: page,
      totalPages: Math.ceil(bookmarks.count / limit),
      totalThreadBookmarks: bookmarks.count
    });

  } catch (err) {
    console.error('Error fetching user bookmarked threads:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * Check if user has bookmarked a specific thread
 * GET /api/thread-bookmarks/:threadId/check
 */
router.get('/:threadId/check', auth, async (req, res) => {
  try {
    const thread = await Thread.findByPk(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ msg: 'Thread not found' });
    }

    const bookmark = await ThreadBookmark.findOne({
      where: {
        user_id: req.user.userId,
        thread_id: req.params.threadId
      }
    });

    res.json({
      isBookmarked: !!bookmark,
      total_bookmarks: thread.total_bookmarks
    });

  } catch (err) {
    console.error('Error checking bookmark status:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;