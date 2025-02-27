// routes/recommendationRoutes.js

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const recommendationService = require('../services/recommendationService');

/**
 * @route   GET /api/recommendations
 * @desc    Get paginated recommendations for the authenticated user
 * @access  Private
 */
router.get('/recommendations', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 21;

        // Input validation
        if (page < 1) {
            return res.status(400).json({ 
                error: 'Page number must be greater than 0' 
            });
        }

        const recommendations = await recommendationService.getRecommendedCigars(
            userId,
            page,
            pageSize
        );

        // If there's a message (e.g., "Please begin bookmarking cigars..."), include it
        if (recommendations.message) {
            return res.json({
                message: recommendations.message,
                cigars: [],
                hasMore: false,
                currentPage: page
            });
        }

        res.json({
            cigars: recommendations.cigars,
            hasMore: recommendations.hasMore,
            currentPage: recommendations.currentPage
        });

    } catch (error) {
        console.error('Error in recommendation route:', error);
        res.status(500).json({ 
            error: 'Failed to fetch recommendations',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/recommendations/similar-users
 * @desc    Get similar users (for debugging/admin purposes)
 * @access  Private
 */
router.get('/recommendations/similar-users', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const similarUsers = await recommendationService.findSimilarUsers(userId);
        
        res.json({
            similarUsers,
            count: similarUsers.length
        });
    } catch (error) {
        console.error('Error fetching similar users:', error);
        res.status(500).json({ 
            error: 'Failed to fetch similar users',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;