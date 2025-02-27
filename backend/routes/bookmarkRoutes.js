// routes/bookmarkRoutes.js
const express = require('express');
const router = express.Router();
const { Cigar, User, Bookmark, Brand, sequelize } = require('../models');
const { Op } = require('sequelize'); 
const { auth } = require('../middleware/auth');
const recommendationService = require('../services/recommendationService');

/**
 * Bookmark a cigar
 * POST /api/bookmarks/cigars/:id
 */
router.post('/cigars/:id', auth, async (req, res) => {
  let transaction;
  
  try {
    transaction = await sequelize.transaction();

    // Check if cigar exists
    const cigar = await Cigar.findByPk(req.params.id, { transaction });
    if (!cigar) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Cigar not found' });
    }

    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({
      where: {
        user_id: req.user.userId,
        cigar_id: req.params.id
      },
      transaction
    });

    if (existingBookmark) {
      await transaction.rollback();
      return res.status(400).json({ msg: 'Cigar already bookmarked' });
    }

    // Create bookmark
    await Bookmark.create({
      user_id: req.user.userId,
      cigar_id: req.params.id
    }, { transaction });

    // Increment cigar's total_bookmarks
    await cigar.increment('total_bookmarks', { transaction });
    
    // Increment user's bookmark_count
    await User.increment('bookmark_count', {
      where: { id: req.user.userId },
      transaction
    });

    // Invalidate recommendation cache before committing
    await recommendationService.invalidateUserCache(req.user.userId);

    await transaction.commit();

    // Get fresh cigar data after the transaction
    const updatedCigar = await Cigar.findByPk(req.params.id);

    res.json({
      msg: 'Cigar bookmarked successfully',
      total_bookmarks: updatedCigar.total_bookmarks
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error('Error bookmarking cigar:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * Remove a bookmark
 * DELETE /api/bookmarks/cigars/:id
 */
router.delete('/cigars/:id', auth, async (req, res) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();

    // Check if cigar exists
    const cigar = await Cigar.findByPk(req.params.id, { transaction });
    if (!cigar) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Cigar not found' });
    }

    // Find and delete bookmark
    const bookmark = await Bookmark.findOne({
      where: {
        user_id: req.user.userId,
        cigar_id: req.params.id
      },
      transaction
    });

    if (!bookmark) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Bookmark not found' });
    }

    await bookmark.destroy({ transaction });

    // Decrement cigar's total_bookmarks
    await cigar.decrement('total_bookmarks', { transaction });
    
    // Decrement user's bookmark_count
    await User.decrement('bookmark_count', {
      where: { id: req.user.userId },
      transaction
    });

    // Invalidate recommendation cache before committing
    await recommendationService.invalidateUserCache(req.user.userId);

    await transaction.commit();

    // Get fresh cigar data after the transaction
    const updatedCigar = await Cigar.findByPk(req.params.id);

    res.json({
      msg: 'Bookmark removed successfully',
      total_bookmarks: updatedCigar.total_bookmarks
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error('Error removing bookmark:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * Get user's bookmarked cigars - Fixed Version
 * GET /api/bookmarks/cigars
 */
router.get('/cigars', auth, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
  
      // First get the bookmark records
      const bookmarks = await Bookmark.findAndCountAll({
        where: { user_id: req.user.userId },
        limit,
        offset,
        order: [['created_at', 'DESC']], // Most recent bookmarks first
        attributes: ['cigar_id'], // Only get the cigar IDs
      });
  
      if (bookmarks.rows.length === 0) {
        return res.json({
          cigars: [],
          currentPage: page,
          totalPages: 0,
          totalBookmarks: 0
        });
      }
  
      // Then get the cigar details in a single query
      const cigarIds = bookmarks.rows.map(bookmark => bookmark.cigar_id);
      const cigars = await Cigar.findAll({
        where: { id: cigarIds },
        include: [{
          model: Brand,
          as: 'brand',
          attributes: ['name']
        }],
        order: sequelize.literal(`CASE WHEN "Cigar"."id" = ANY(ARRAY[${cigarIds.join(',')}]) THEN array_position(ARRAY[${cigarIds.join(',')}], "Cigar"."id") END`),
      });
  
      res.json({
        cigars,
        currentPage: page,
        totalPages: Math.ceil(bookmarks.count / limit),
        totalBookmarks: bookmarks.count
      });
  
    } catch (err) {
      console.error('Error fetching bookmarked cigars:', err);
      res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * Check if user has bookmarked a specific cigar
 * GET /api/bookmarks/cigars/:id/check
 */
router.get('/cigars/:id/check', auth, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      where: {
        user_id: req.user.userId,
        cigar_id: req.params.id
      }
    });

    const cigar = await Cigar.findByPk(req.params.id);
    if (!cigar) {
      return res.status(404).json({ msg: 'Cigar not found' });
    }

    res.json({
      isBookmarked: !!bookmark,
      total_bookmarks: cigar.total_bookmarks
    });

  } catch (err) {
    console.error('Error checking bookmark status:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * Get most bookmarked cigars
 * GET /api/bookmarks/popular
 */
router.get('/popular', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
  
      const popularCigars = await Cigar.findAll({
        where: {
          total_bookmarks: {
            [Op.gt]: 0
          }
        },
        include: [{
          model: Brand,
          as: 'brand',
          attributes: ['name']
        }],
        order: [['total_bookmarks', 'DESC']],
        limit
      });
  
      res.json(popularCigars);
    } catch (err) {
      console.error('Error fetching popular bookmarked cigars:', err);
      res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;