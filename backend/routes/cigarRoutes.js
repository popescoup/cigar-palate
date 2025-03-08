// backend/routes/cigarRoutes.js

/*
Defines the Express routes for handling operations related to cigars, including creating, retrieving, updating, and deleting cigars. 
Supports image uploads via Multer for cigar images.
Includes error handling, pagination for cigar retrieval, and file type/size validation.
*/

const express = require('express');
const Cigar = require('../models/cigar');
const Brand = require('../models/brand');
const Review = require('../models/review');
const FlavorRanking = require('../models/flavorRanking');
const multer = require('multer');
const path = require('path');
const { Sequelize, Op } = require('sequelize');
const sequelize = require('../config'); 
const Rating = require('../models/rating');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { calculateSimilarityScore } = require('../services/similarityService');
const spacesUploadMiddleware = require('../middleware/spacesUploadMiddleware');
const { deleteImage } = require('../utils/spaces-config');

const getTopRatedCigars = async (limit = null, skip = null, page = null, itemsPerPage = null) => {
  // Ensure limit is a number and has a maximum value
  const effectiveLimit = limit ? Math.min(parseInt(limit), 10) : null;
  
  const queryOptions = {
    attributes: [
      'id',
      'name',
      'averageRating',
      'numberOfRatings',
      'totalRatings',
      'image_key',
      'flavors',
      'price_range',
      'dimensions',
      'made_by'
    ],
    include: [
      { 
        model: Brand, 
        as: 'brand', 
        attributes: ['name'] 
      }
    ],
    order: [
      ['averageRating', 'DESC'],
      ['numberOfRatings', 'DESC'],  // Secondary sort by number of ratings
      ['name', 'ASC']               // Tertiary sort by name for consistent ordering
    ],
    where: {
      numberOfRatings: {
        [Op.gt]: 0  // Only include cigars that have ratings
      }
    }
  };

  // Progressive loading (homepage)
  if (effectiveLimit !== null) {
    queryOptions.limit = effectiveLimit;
    if (skip !== null) {
      queryOptions.offset = parseInt(skip);
    }
  }
  // Pagination (discover page)
  else if (page !== null && itemsPerPage !== null) {
    queryOptions.offset = (page - 1) * itemsPerPage;
    queryOptions.limit = itemsPerPage;

    // Get total count for pagination
    const count = await Cigar.count({
      where: queryOptions.where
    });

    const cigars = await Cigar.findAll(queryOptions);

    return {
      cigars,
      totalPages: Math.ceil(count / itemsPerPage),
      currentPage: page,
      totalCigars: count
    };
  }

  // Just return cigars
  return await Cigar.findAll(queryOptions);
};

const getTrendingCigars = async (limit = null, skip = null, page = null, itemsPerPage = null) => {
  // Ensure limit is a number and has a maximum value
  const effectiveLimit = limit ? Math.min(parseInt(limit), 10) : null;
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const queryOptions = {
    attributes: [
      'id',
      'name',
      'averageRating',
      'numberOfRatings',
      'image_key',
      'flavors',
      'price_range',
      'dimensions',
      'made_by',
      [
        Sequelize.literal(`(
          SELECT COUNT(*)::integer 
          FROM "Ratings" 
          WHERE "Ratings"."cigar_id" = "Cigar"."id" 
          AND "Ratings"."created_at" >= '${sevenDaysAgo.toISOString()}'
        )`),
        'recentRatingsCount'
      ],
      [
        Sequelize.literal(`(
          SELECT COUNT(*)::integer 
          FROM "Reviews" 
          WHERE "Reviews"."cigar_id" = "Cigar"."id" 
          AND "Reviews"."created_at" >= '${sevenDaysAgo.toISOString()}'
        )`),
        'recentReviewsCount'
      ]
    ],
    include: [
      { 
        model: Brand, 
        as: 'brand', 
        attributes: ['name'] 
      }
    ],
    group: ['Cigar.id', 'brand.id', 'brand.name'],
    order: [
      [
        Sequelize.literal(`(
          (SELECT COUNT(*) FROM "Ratings" 
           WHERE "Ratings"."cigar_id" = "Cigar"."id" 
           AND "Ratings"."created_at" >= '${sevenDaysAgo.toISOString()}') +
          (SELECT COUNT(*) FROM "Reviews" 
           WHERE "Reviews"."cigar_id" = "Cigar"."id" 
           AND "Reviews"."created_at" >= '${sevenDaysAgo.toISOString()}')
        )`),
        'DESC'
      ],
      ['averageRating', 'DESC'],  // Secondary sort by average rating
      ['name', 'ASC']             // Tertiary sort by name
    ]
  };

  // Progressive loading (homepage)
  if (effectiveLimit !== null) {
    queryOptions.limit = effectiveLimit;
    if (skip !== null) {
      queryOptions.offset = parseInt(skip);
    }
  }
  // Pagination (discover page)
  else if (page !== null && itemsPerPage !== null) {
    queryOptions.offset = (page - 1) * itemsPerPage;
    queryOptions.limit = itemsPerPage;

    // Get total count for pagination
    const totalCount = await Cigar.count({
      where: queryOptions.where,
      include: queryOptions.include,
      distinct: true
    });

    const cigars = await Cigar.findAll(queryOptions);

    const formattedCigars = cigars.map(cigar => {
      const cigarData = cigar.get({ plain: true });
      return {
        ...cigarData,
        totalRecentInteractions: cigarData.recentRatingsCount + cigarData.recentReviewsCount
      };
    });

    return {
      cigars: formattedCigars,
      currentPage: page,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      totalCigars: totalCount
    };
  }

  // Just return formatted cigars
  const cigars = await Cigar.findAll(queryOptions);
  return cigars.map(cigar => {
    const cigarData = cigar.get({ plain: true });
    return {
      ...cigarData,
      totalRecentInteractions: cigarData.recentRatingsCount + cigarData.recentReviewsCount
    };
  });
};

const getAlphabeticalCigars = async (cursor = null, limit = 100) => {
  const queryOptions = {
    attributes: ['id', 'name'],
    order: [['name', 'ASC']],
    limit: limit + 1, // Get one extra to check if there are more items
    where: {}
  };

  // If cursor provided, get items after that cigar name
  if (cursor) {
    queryOptions.where = {
      name: {
        [Op.gt]: cursor
      }
    };
  }

  const cigars = await Cigar.findAll(queryOptions);

  // Check if there are more items
  const hasNextPage = cigars.length > limit;
  const items = hasNextPage ? cigars.slice(0, -1) : cigars;
  const nextCursor = hasNextPage ? items[items.length - 1].name : null;

  return {
    items,
    nextCursor,
    hasNextPage
  };
};

// Route to create a new cigar (with image upload and new brand logic)
router.post('/cigars', spacesUploadMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
      const {
          name,
          brand_id,
          new_brand,
          flavors,
          description
      } = req.body;

      // Validate required fields
      if (!name?.trim()) {
          if (req.processedImages?.cigar) {
              await deleteImage(req.processedImages.cigar.key);
          }
          await transaction.rollback();
          return res.status(400).json({ error: 'Cigar name is required' });
      }

      if (!flavors?.trim()) {
          if (req.processedImages?.cigar) {
              await deleteImage(req.processedImages.cigar.key);
          }
          await transaction.rollback();
          return res.status(400).json({ error: 'Flavors are required' });
      }

      if (!description?.trim()) {
          if (req.processedImages?.cigar) {
              await deleteImage(req.processedImages.cigar.key);
          }
          await transaction.rollback();
          return res.status(400).json({ error: 'Description is required' });
      }

      let finalBrandId = brand_id;

      // If a new brand is provided, add it to the Brand table
      if (new_brand) {
          try {
              const newBrand = await Brand.create({ name: new_brand }, { transaction });
              finalBrandId = newBrand.id;
          } catch (brandError) {
              await transaction.rollback();
              if (req.processedImages?.cigar) {
                  await deleteImage(req.processedImages.cigar.key);
              }
              return res.status(400).json({ error: 'Failed to create new brand', details: brandError.message });
          }
      }

      // Image handling: Get the key if an image file is uploaded
      const imageKey = req.processedImages?.cigar?.key;
      if (!imageKey) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Cigar image is required' });
      }

      // Prepare cigar data with required fields
      const cigarData = {
        name,
        image_key: imageKey,
        brand_id: finalBrandId,
        flavors,
        description
    };

    // Add optional fields only if they have values
    if (req.body.shape) cigarData.shape = req.body.shape;
    if (req.body.size) cigarData.size = req.body.size;
    if (req.body.color) cigarData.color = req.body.color;
    if (req.body.wrap_type) cigarData.wrap_type = req.body.wrap_type;
    if (req.body.filler) cigarData.filler = req.body.filler;
    if (req.body.country_of_origin) cigarData.country_of_origin = req.body.country_of_origin;
    if (req.body.aging) cigarData.aging = parseInt(req.body.aging, 10);
    if (req.body.dimensions) cigarData.dimensions = req.body.dimensions;
    if (req.body.made_by) cigarData.made_by = req.body.made_by;
    if (req.body.handmade === 'true' || req.body.handmade === 'false') {
        cigarData.handmade = req.body.handmade === 'true';
    }

    // Add new fields with validation
    if (req.body.price_range) {
        const validPriceRanges = ['<$10', '$10.01 - $25', '$25.01 - $50', '$50.01 - $75', '$75.01 - $100', '$100.01<'];
        if (!validPriceRanges.includes(req.body.price_range)) {
            await transaction.rollback();
            if (req.processedImages?.cigar) {
                await deleteImage(req.processedImages.cigar.key);
            }
            return res.status(400).json({ error: 'Invalid price range' });
        }
        cigarData.price_range = req.body.price_range;
    }
    if (req.body.strength) cigarData.strength = req.body.strength;
    if (req.body.binder) cigarData.binder = req.body.binder;

    // Create the cigar entry in the database
    const cigar = await Cigar.create(cigarData, { transaction });

    await transaction.commit();
    res.status(201).json(cigar);
} catch (err) {
    await transaction.rollback();
    // Clean up the processed image if anything fails
    if (req.processedImages?.cigar) {
        try {
            await deleteImage(req.processedImages.cigar.key);
            console.log('Cleaned up processed image after failed cigar creation');
        } catch (deleteErr) {
            console.error('Error deleting processed image:', deleteErr);
        }
    }
    console.error('Error creating cigar:', err);
    res.status(400).json({ error: 'Failed to add cigar', details: err.message });
}
});

// Route to retrieve cigars with pagination and associated brand info
router.get('/cigars', async (req, res) => {
  const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 21;  // Default to 21 cigars per page
  const offset = (page - 1) * limit;  // Calculate the starting point for cigars

  try {
    // Retrieve cigars with pagination and include associated brands using the alias
    const cigars = await Cigar.findAndCountAll({
      limit: limit,
      offset: offset,
      include: [
        {
          model: Brand,
          as: 'brand',  // Specify the alias for the association
          attributes: ['name'],  // Only select the name field from Brand
        }
      ],
      order: [
        ['name', 'ASC'],  // Primary sort by cigar name
        [{ model: Brand, as: 'brand' }, 'name', 'ASC']  // Secondary sort by brand name
      ]
    });

    // Respond with cigars and pagination metadata
    res.status(200).json({
      cigars: cigars.rows,  // The cigars on the current page
      currentPage: page,  // Current page number
      totalPages: Math.ceil(cigars.count / limit),  // Total number of pages
      totalCigars: cigars.count,  // Total number of cigars in the database
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve cigars', details: err.message });
  }
});

router.get('/cigars/alphabetical', async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const limit = parseInt(req.query.limit) || 100;

    const result = await getAlphabeticalCigars(cursor, limit);

    res.status(200).json({
      cigars: result.items,
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to retrieve cigars', 
      details: err.message 
    });
  }
});

// Route for home page (top 10)
router.get('/cigars/top-rated', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;
    const topCigars = await getTopRatedCigars(limit, skip);
    res.json(topCigars);
  } catch (error) {
    console.error('Error fetching top-rated cigars:', error);
    res.status(500).json({ error: 'Failed to fetch top-rated cigars', details: error.message });
  }
});

// Route for full list with pagination
router.get('/cigars/top-rated/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.limit) || 21;
    
    const result = await getTopRatedCigars(null, null, page, itemsPerPage);
    
    res.json({
      cigars: result.cigars,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalCigars: result.totalCigars
    });
  } catch (error) {
    console.error('Error fetching all top-rated cigars:', error);
    res.status(500).json({ error: 'Failed to fetch top-rated cigars', details: error.message });
  }
});

// Route for home page (trending)
router.get('/cigars/trending', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;
    const trendingCigars = await getTrendingCigars(limit, skip);
    res.json(trendingCigars);
  } catch (error) {
    console.error('Error fetching trending cigars:', error);
    res.status(500).json({ error: 'Failed to fetch trending cigars', details: error.message });
  }
});

// Route for full trending list
router.get('/cigars/trending/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.limit) || 21;
    
    const result = await getTrendingCigars(null, null, page, itemsPerPage);
    
    res.json({
      cigars: result.cigars,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalCigars: result.totalCigars
    });
  } catch (error) {
    console.error('Error fetching all trending cigars:', error);
    res.status(500).json({ error: 'Failed to fetch trending cigars', details: error.message });
  }
});

// Route to retrieve a single cigar by ID (with brand information)
router.get('/cigars/:id', async (req, res) => {
    try {
      const cigar = await Cigar.findByPk(req.params.id, {
        include: [{ model: Brand, as: 'brand', attributes: ['name'] }]
      });
  
      if (cigar) {
        res.status(200).json(cigar);
      } else {
        res.status(404).json({ error: 'Cigar not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve cigar', details: err.message });
    }
});

// Route to update a cigar by ID
router.put('/cigars/:id', spacesUploadMiddleware, async (req, res) => {
  // Validate required fields
  if (!req.body.name?.trim()) {
    if (req.processedImages?.cigar) {
        await deleteImage(req.processedImages.cigar.key);
    }
    return res.status(400).json({ error: 'Cigar name is required' });
  }

  if (!req.body.flavors?.trim()) {
    if (req.processedImages?.cigar) {
        await deleteImage(req.processedImages.cigar.key);
    }
    return res.status(400).json({ error: 'Flavors are required' });
  }

  if (!req.body.description?.trim()) {
    if (req.processedImages?.cigar) {
        await deleteImage(req.processedImages.cigar.key);
    }
    return res.status(400).json({ error: 'Description is required' });
  }
  
  const transaction = await sequelize.transaction();
    try {
        const cigar = await Cigar.findByPk(req.params.id, { transaction });
        if (!cigar) {
            if (req.processedImages?.cigar) {
                await deleteImage(req.processedImages.cigar.key);
            }
            await transaction.rollback();
            return res.status(404).json({ error: 'Cigar not found' });
        }
      
      // Store old image key for cleanup
      const oldImageKey = cigar.image_key;

      let finalBrandId = req.body.brand_id;   

      // Handle new brand creation if provided
      if (req.body.new_brand) {
        try {
            const newBrand = await Brand.create({ name: req.body.new_brand }, { transaction });
            finalBrandId = newBrand.id;
        } catch (brandError) {
            await transaction.rollback();
            if (req.processedImages?.cigar) {
                await deleteImage(req.processedImages.cigar.key);
            }
            return res.status(400).json({ error: 'Failed to create new brand', details: brandError.message });
        }
      }

      // Update the image if a new file is uploaded
      const imageKey = req.processedImages?.cigar?.key || cigar.image_key;

      // Prepare update data with required fields
      const updateData = {
        name: req.body.name,
        image_key: imageKey,
        brand_id: finalBrandId,
        flavors: req.body.flavors,
        description: req.body.description
      };

      // Add optional fields only if they have values
      if (req.body.shape) updateData.shape = req.body.shape;
      if (req.body.size) updateData.size = req.body.size;
      if (req.body.color) updateData.color = req.body.color;
      if (req.body.wrap_type) updateData.wrap_type = req.body.wrap_type;
      if (req.body.filler) updateData.filler = req.body.filler;
      if (req.body.country_of_origin) updateData.country_of_origin = req.body.country_of_origin;
      if (req.body.aging) updateData.aging = parseInt(req.body.aging, 10);
      if (req.body.dimensions) updateData.dimensions = req.body.dimensions;
      if (req.body.made_by) updateData.made_by = req.body.made_by;
      if (req.body.handmade === 'true' || req.body.handmade === 'false') {
        updateData.handmade = req.body.handmade === 'true';
      }

      // Add new fields
      if (req.body.price_range) {
        const validPriceRanges = ['<$10', '$10.01 - $25', '$25.01 - $50', '$50.01 - $75', '$75.01 - $100', '$100.01<'];
        if (!validPriceRanges.includes(req.body.price_range)) {
            await transaction.rollback();
            if (req.processedImages?.cigar) {
                await deleteImage(req.processedImages.cigar.key);
            }
            return res.status(400).json({ error: 'Invalid price range' });
        }
        updateData.price_range = req.body.price_range;
      }
      if (req.body.strength) updateData.strength = req.body.strength;
      if (req.body.binder) updateData.binder = req.body.binder;

      // Update the cigar
      await cigar.update(updateData, { transaction });

      // If we successfully updated and had a new image, clean up the old one
      if (req.processedImages?.cigar?.key && oldImageKey) {
        try {
            await deleteImage(oldImageKey);
            console.log('Deleted old cigar image:', oldImageKey);
        } catch (error) {
            console.error('Error deleting old cigar image:', error);
            // Don't rollback for failed cleanup
        }
      }

      await transaction.commit();
      res.status(200).json(cigar);

  } catch (err) {
      await transaction.rollback();
      // Clean up processed image if update fails
      if (req.processedImages?.cigar) {
        try {
            await deleteImage(req.processedImages.cigar.key);
            console.log('Cleaned up new processed image after failed update');
        } catch (deleteErr) {
            console.error('Error deleting new processed image:', deleteErr);
        }
      }
      console.error('Error updating cigar:', err);
      res.status(400).json({ error: 'Failed to update cigar', details: err.message });
  }
});

// Route to delete a cigar by ID
router.delete('/cigars/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const cigar = await Cigar.findByPk(req.params.id, { transaction });
    if (!cigar) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Cigar not found' });
    }

    // Store image key for cleanup
    const imageKey = cigar.image_key;

    // Delete the cigar
    await cigar.destroy({ transaction });
    await transaction.commit();

    // Clean up image file after successful database operations
    if (imageKey) {
      try {
        await deleteImage(imageKey);
        console.log('Deleted cigar image:', imageKey);
      } catch (deleteErr) {
        console.error('Error deleting cigar image:', deleteErr);
        // Don't throw error for cleanup failure
      }
    }

    res.status(204).end();
  } catch (err) {
    await transaction.rollback();
    console.error('Error deleting cigar:', err);
    res.status(500).json({ error: 'Failed to delete cigar', details: err.message });
  }
});

/**
 * GET /cigars/:id/similar
 * Returns up to 25 similar cigars, sorted by similarity score and then by number of ratings
 * Requires at least 1 matching flavor and 4 matching physical characteristics
 */
router.get('/cigars/:id/similar', async (req, res) => {
  try {
    const cigarId = req.params.id;
    const baseCigar = await Cigar.findByPk(cigarId);

    if (!baseCigar) {
      return res.status(404).json({ error: 'Cigar not found' });
    }

    // Keep the original query to maintain similarity calculations
    const potentialMatches = await Cigar.findAll({
      where: {
        id: { [Op.ne]: cigarId }
      },
      include: [
        { 
          model: Brand, 
          as: 'brand', 
          attributes: ['name'] 
        }
      ],
      // Add the attributes we need for the cards
      attributes: [
        'id',
        'name',
        'image_key',
        'averageRating',
        'numberOfRatings',
        'flavors',
        'price_range',
        'shape',
        'size',
        'color',
        'wrap_type',
        'filler',
        'country_of_origin',
        'binder',
        'strength',
        'dimensions',
        'made_by'
      ]
    });

    // Keep existing similarity calculation and filtering
    const similarCigars = potentialMatches
      .map(cigar => {
        const similarity = calculateSimilarityScore(baseCigar, cigar);
        return {
          cigar,
          ...similarity
        };
      })
      .filter(({ commonFlavorCount, physicalMatchCount }) => 
        commonFlavorCount >= 1 && physicalMatchCount >= 5
      )
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.cigar.numberOfRatings - a.cigar.numberOfRatings;
      })
      .slice(0, 25)
      .map(({ cigar }) => cigar);

    res.json(similarCigars);
  } catch (error) {
    console.error('Error fetching similar cigars:', error);
    res.status(500).json({ error: 'Failed to fetch similar cigars' });
  }
});

// Route to get flavor rankings for a cigar
router.get('/cigars/:id/flavor-rankings', async (req, res) => {
  try {
    const cigarId = req.params.id;
    const rankings = await FlavorRanking.findAll({
      where: { cigarId: cigarId },
      attributes: ['flavor', 'totalRank', 'voteCount'],
    });

    // Calculate average ranks
    const averageRankings = rankings.reduce((acc, ranking) => {
      acc[ranking.flavor] = ranking.totalRank / ranking.voteCount;
      return acc;
    }, {});

    res.json(averageRankings);
  } catch (error) {
    console.error('Error fetching flavor rankings:', error);
    res.status(500).json({ error: 'Failed to fetch flavor rankings' });
  }
});

// Route to check if user has ranked flavors
router.get('/cigars/:id/flavor-rankings/check', auth, async (req, res) => {
  try {
    const userRanking = await FlavorRanking.findOne({
      where: {
        userId: req.user.userId,
        cigarId: req.params.id
      }
    });

    res.json({
      hasRanked: !!userRanking
    });
  } catch (error) {
    console.error('Error checking flavor ranking status:', error);
    res.status(500).json({ error: 'Failed to check flavor ranking status' });
  }
});

// Route to submit flavor rankings
router.post('/cigars/:id/flavor-rankings', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const cigarId = req.params.id;
    const userId = req.user.userId;
    const { rankings } = req.body;

    // Check if user has already ranked
    const existingRankings = await FlavorRanking.findOne({
      where: {
        userId,
        cigarId
      },
      transaction
    });

    if (existingRankings) {
      await transaction.rollback();
      return res.status(400).json({ error: 'You have already ranked this cigar\'s flavors' });
    }

    // Process each flavor ranking
    for (const { flavor, rank } of rankings) {
      // Find existing flavor ranking
      const flavorRanking = await FlavorRanking.findOne({
        where: { 
          cigarId,
          flavor
        },
        transaction
      });

      if (flavorRanking) {
        // Update existing ranking
        await   flavorRanking.update({
          totalRank: flavorRanking.totalRank + rank,
          voteCount: flavorRanking.voteCount + 1,
          userId // Add the user's ID to track who ranked
        }, { transaction });
      } else {
        // Create new ranking
        await FlavorRanking.create({
          cigarId,
          userId,
          flavor,
          totalRank: rank,
          voteCount: 1
        }, { transaction });
      }
    }

    await transaction.commit();
    res.status(201).json({ message: 'Flavor rankings submitted successfully' });

  } catch (error) {
    await transaction.rollback();
    console.error('Error submitting flavor rankings:', error);
    res.status(500).json({ error: 'Failed to submit flavor rankings' });
  }
});

// Route to rate a cigar
router.post('/cigars/:id/rate', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const cigarId = req.params.id;
    const userId = req.user.userId;
    const { rating } = req.body;

    if (typeof rating !== 'number' || rating < 0 || rating > 100) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid rating. Must be a number between 0 and 100.' });
    }

    const cigar = await Cigar.findByPk(cigarId, { transaction });
    if (!cigar) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Cigar not found' });
    }

    // Check for existing rating
    const existingRating = await Rating.findOne({
      where: {
        user_id: userId,
        cigar_id: cigarId
      },
      transaction
    });

    if (existingRating) {
      await transaction.rollback();
      return res.status(400).json({ error: 'You have already rated this cigar' });
    }

    // Create new rating
    await Rating.create({
      user_id: userId,
      cigar_id: cigarId,
      rating_value: rating
    }, { transaction });

    // Get the new rating statistics using database functions
    const ratingStats = await Rating.findAll({
      where: { cigar_id: cigarId },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('rating_value')), 'total'],
        [Sequelize.fn('AVG', Sequelize.col('rating_value')), 'average']
      ],
      transaction
    });

    // Extract values from the stats results
    const numberOfRatings = parseInt(ratingStats[0].getDataValue('count'));
    const totalRatings = parseInt(ratingStats[0].getDataValue('total'));
    const averageRating = parseFloat(ratingStats[0].getDataValue('average'));

    // Update cigar
    await cigar.update({
      averageRating,
      numberOfRatings,
      totalRatings
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: 'Rating submitted successfully',
      averageRating,
      numberOfRatings
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Failed to submit rating', details: error.message });
  }
});

// Route to get user's rating for a cigar
router.get('/cigars/:id/user-rating', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const rating = await Rating.findOne({
      where: {
        user_id: req.user.userId,
        cigar_id: req.params.id
      }
    });

    res.json({
      hasRated: !!rating,
      rating: rating ? rating.rating_value : null
    });
  } catch (error) {
    console.error('Error checking user rating:', error);
    res.status(500).json({ error: 'Failed to check user rating' });
  }
});

module.exports = router;