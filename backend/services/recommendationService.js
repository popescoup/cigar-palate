// services/recommendationService.js

const { Bookmark, User, Cigar, Brand, Rating } = require('../models');
const { redis } = require('../config');
const { Sequelize } = require('sequelize');
const sequelize = require('../config');
const { Op } = require('sequelize');

// Configuration constants
const CACHE_DURATION = 3600; // 1 hour in seconds
const MAX_RECENT_BOOKMARKS = 20;
const MAX_RECOMMENDATIONS = 100;

const recommendationService = {
    /**
     * Calculate Jaccard similarity between two users based on their recent bookmarks
     */
    async calculateJaccardSimilarity(user1Id, user2Id) {
        try {
            // Get recent bookmarks for both users
            const [user1Bookmarks, user2Bookmarks] = await Promise.all([
                Bookmark.findAll({
                    where: { user_id: user1Id },
                    order: [['created_at', 'DESC']],
                    limit: MAX_RECENT_BOOKMARKS,
                    attributes: ['cigar_id']
                }),
                Bookmark.findAll({
                    where: { user_id: user2Id },
                    order: [['created_at', 'DESC']],
                    limit: MAX_RECENT_BOOKMARKS,
                    attributes: ['cigar_id']
                })
            ]);

            // Convert to Sets for efficient intersection/union operations
            const user1CigarIds = new Set(user1Bookmarks.map(b => b.cigar_id));
            const user2CigarIds = new Set(user2Bookmarks.map(b => b.cigar_id));

            // Calculate intersection and union
            const intersection = new Set(
                [...user1CigarIds].filter(id => user2CigarIds.has(id))
            );
            const union = new Set([...user1CigarIds, ...user2CigarIds]);

            // Calculate Jaccard similarity
            return union.size === 0 ? 0 : intersection.size / union.size;
        } catch (error) {
            console.error('Error calculating Jaccard similarity:', error);
            throw error;
        }
    },

    /**
     * Find similar users and cache the results
     */
    async findSimilarUsers(userId) {
        try {
            // Check cache first
            const cacheKey = `similar_users:${userId}`;
            const cachedSimilarUsers = await redis.get(cacheKey);
            
            if (cachedSimilarUsers) {
                return cachedSimilarUsers;
            }
    
            // Get all users who have bookmarks (except the current user)
            const users = await User.findAll({
                where: {
                    id: { [Op.ne]: userId }
                },
                include: [{
                    model: Cigar,
                    as: 'bookmarkedCigars',  // Use the correct association name
                    through: { attributes: [] },
                    required: true
                }],
                attributes: ['id']
            });
    
            // Calculate similarity with each user
            const similarityScores = await Promise.all(
                users.map(async (user) => {
                    const similarity = await this.calculateJaccardSimilarity(userId, user.id);
                    return {
                        userId: user.id,
                        similarity
                    };
                })
            );
    
            // Sort by similarity (highest first) and filter out zero similarity
            const sortedSimilarUsers = similarityScores
                .filter(score => score.similarity > 0)
                .sort((a, b) => b.similarity - a.similarity);
    
            // Cache the results
            await redis.set(cacheKey, sortedSimilarUsers, CACHE_DURATION);
    
            return sortedSimilarUsers;
        } catch (error) {
            console.error('Error finding similar users:', error);
            throw error;
        }
    },

    /**
     * Get user's existing interactions (bookmarks and ratings)
     */
    async getUserInteractions(userId) {
        const [bookmarks, ratings] = await Promise.all([
            Bookmark.findAll({
                where: { user_id: userId },
                attributes: ['cigar_id']
            }),
            Rating.findAll({
                where: { user_id: userId },
                attributes: ['cigar_id']
            })
        ]);

        return new Set([
            ...bookmarks.map(b => b.cigar_id),
            ...ratings.map(r => r.cigar_id)
        ]);
    },

    /**
     * Generate recommendations from similar users
     */
    async generateRecommendations(userId, similarUsers, userInteractions) {
        let recommendations = [];
        
        for (const similarUser of similarUsers) {
            const similarUserBookmarks = await Bookmark.findAll({
                where: { user_id: similarUser.userId },
                order: [['created_at', 'DESC']],
                attributes: ['cigar_id']
            });

            // Filter out cigars the user has already interacted with
            const newCigars = similarUserBookmarks
                .map(bookmark => ({
                    cigarId: bookmark.cigar_id,
                    similarityScore: similarUser.similarity
                }))
                .filter(cigar => !userInteractions.has(cigar.cigarId));

            recommendations = [...recommendations, ...newCigars];

            // Break if we have enough recommendations
            if (recommendations.length >= MAX_RECOMMENDATIONS) {
                recommendations = recommendations.slice(0, MAX_RECOMMENDATIONS);
                break;
            }
        }

        return recommendations;
    },

    /**
     * Get paginated recommendations using Redis cache
     */
    async getPaginatedRecommendations(userId, similarUsers, userInteractions, startIndex, pageSize) {
        const cacheKey = `recommendations:${userId}`;
        let recommendedCigars = await redis.get(cacheKey);
        
        if (!recommendedCigars) {
            recommendedCigars = await this.generateRecommendations(userId, similarUsers, userInteractions);
            await redis.set(cacheKey, recommendedCigars, CACHE_DURATION);
        }

        const paginatedCigars = recommendedCigars.slice(startIndex, startIndex + pageSize);
        
        if (paginatedCigars.length === 0) {
            return {
                cigars: [],
                hasMore: false
            };
        }

        // Fetch full cigar details for the paginated subset
        const cigars = await Cigar.findAll({
            attributes: [
                'id',
                'name',
                'averageRating',
                'numberOfRatings',
                'image_path',    // Added
                'flavors',       // Added
                'price_range'    // Added
            ],
            where: { 
                id: paginatedCigars.map(c => c.cigarId) 
            },
            include: [{
                model: Brand,
                as: 'brand',
                attributes: ['name', 'image_path']  // Added brand image_path
            }],
            order: [
                [Sequelize.literal(`ARRAY_POSITION(ARRAY[${paginatedCigars.map(c => c.cigarId).join(',')}], "Cigar"."id")`)]
            ],
        });

        return {
            cigars: cigars.map(cigar => ({
                ...cigar.toJSON(),
                similarityScore: paginatedCigars.find(c => c.cigarId === cigar.id)?.similarityScore
            })),
            hasMore: startIndex + pageSize < recommendedCigars.length
        };
    },

    /**
     * Main function to get recommended cigars for a user with pagination
     */
    async getRecommendedCigars(userId, page = 1, pageSize = 21) {
        try {
            // Check if user has any bookmarks
            const hasBookmarks = await Bookmark.findOne({
                where: { user_id: userId }
            });

            if (!hasBookmarks) {
                return {
                    cigars: [],
                    hasMore: false,
                    message: "Please begin bookmarking cigars to build up your recommendation profile"
                };
            }

            // Get similar users from cache or calculate them
            const similarUsers = await this.findSimilarUsers(userId);
            
            if (similarUsers.length === 0) {
                return {
                    cigars: [],
                    hasMore: false,
                    message: "No recommendations available at this time"
                };
            }

            // Get user's existing bookmarks and ratings
            const userInteractions = await this.getUserInteractions(userId);
            
            // Calculate start index for pagination
            const startIndex = (page - 1) * pageSize;
            
            // Get recommendations using the pagination cache
            const recommendations = await this.getPaginatedRecommendations(
                userId,
                similarUsers,
                userInteractions,
                startIndex,
                pageSize
            );

            return {
                cigars: recommendations.cigars,
                hasMore: recommendations.hasMore,
                currentPage: page
            };
        } catch (error) {
            console.error('Error getting recommended cigars:', error);
            throw error;
        }
    },

    /**
     * Invalidate user's recommendation cache when they add a new bookmark
     */
    async invalidateUserCache(userId) {
        try {
            const similarUsersCacheKey = `similar_users:${userId}`;
            const recommendationsCacheKey = `recommendations:${userId}`;
            
            await Promise.all([
                redis.delete(similarUsersCacheKey),
                redis.delete(recommendationsCacheKey)
            ]);
        } catch (error) {
            console.error('Error invalidating user cache:', error);
            throw error;
        }
    }
};

module.exports = recommendationService;