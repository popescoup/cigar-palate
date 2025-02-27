// backend/routes/statsRoutes.js

const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const Cigar = require('../models/cigar');
const User = require('../models/user');
const Brand = require('../models/brand');
const Rating = require('../models/rating');
const Review = require('../models/review');

router.get('/stats/site', async (req, res) => {
    try {
        // Use Promise.all to run all queries concurrently
        const [
            totalCigars,
            totalMembers,
            totalReviews,
            totalBrands,
            totalRatings
        ] = await Promise.all([
            // Total Cigars
            Cigar.count(),
            
            // Total verified members
            User.count({
                where: {
                    isVerified: true
                }
            }),
            
            // Total Reviews (excluding replies)
            Review.count({
                where: {
                    parent_id: null
                }
            }),
            
            // Total Brands
            Brand.count(),

            // Total Ratings
            Rating.count()
        ]);

        // Cache the response for 5 minutes
        res.set('Cache-Control', 'public, max-age=300');
        
        res.json({
            totalCigars,
            totalMembers,
            totalReviews: totalReviews + totalRatings, // Combine reviews and ratings for total interactions
            totalBrands
        });

    } catch (error) {
        console.error('Error fetching site stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch site statistics',
            details: error.message 
        });
    }
});

module.exports = router;