// backend/routes/brandRoutes.js

/*
Defines the Express route for handling operations related to brands. 
Provides functionality for fetching all brands, fetching a single brand by ID, 
fetching cigars associated with a brand, and adding a new brand to the DB.
Contains validation for the brand name, pagination for brands, and error handling.
*/

const express = require('express');
const Brand = require('../models/brand');  // Import the Brand model
const Cigar = require('../models/cigar');  // Import the Cigar model
const sequelize = require('../config'); // Import Sequelize instance from config.js
const router = express.Router();  // Create a new Express router
const { Sequelize, Op } = require('sequelize');
const multer = require('multer');
const spacesUploadMiddleware = require('../middleware/spacesUploadMiddleware');
const { deleteImage } = require('../utils/spaces-config');

function safelyLogAssociations(model) {
    const associations = {};
    for (const [key, association] of Object.entries(model.associations)) {
      associations[key] = {
        associationType: association.associationType,
        target: association.target.name,
        as: association.as,
        foreignKey: association.foreignKey,
      };
    }
    console.log(`${model.name} associations:`, JSON.stringify(associations, null, 2));
  }
  // Replace the existing console.log statements with these:
  safelyLogAssociations(Brand);
  safelyLogAssociations(Cigar);
  
  // For logging attributes, we can keep it as is:
  console.log('Brand attributes:', Object.keys(Brand.rawAttributes));
  console.log('Cigar attributes:', Object.keys(Cigar.rawAttributes));

  const getAlphabeticalBrands = async (cursor = null, limit = 100) => {
    const queryOptions = {
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      limit: limit + 1, // Get one extra to check if there are more items
      where: {}
    };
  
    // If cursor provided, get items after that brand name
    if (cursor) {
      queryOptions.where = {
        name: {
          [Op.gt]: cursor
        }
      };
    }
  
    const brands = await Brand.findAll(queryOptions);
  
    // Check if there are more items
    const hasNextPage = brands.length > limit;
    const items = hasNextPage ? brands.slice(0, -1) : brands;
    const nextCursor = hasNextPage ? items[items.length - 1].name : null;
  
    return {
      items,
      nextCursor,
      hasNextPage
    };
  };

  sequelize.options.logging = (sql, queryObject) => {
    console.log('Executed SQL:', sql);
    if (queryObject.bind) {
      console.log('Bind parameters:', queryObject.bind);
    }
  };

  const getTopRatedBrands = async (limit = null, skip = null, page = null, itemsPerPage = null) => {
    // Ensure limit is a number and has a maximum value
    const effectiveLimit = limit ? Math.min(parseInt(limit), 10) : null;
    
    const queryOptions = {
      attributes: [
        'id',
        'name',
        'image_key',
        [Sequelize.fn('AVG', Sequelize.col('cigars.averageRating')), 'avgRating'],
        [Sequelize.fn('COUNT', Sequelize.col('cigars.id')), 'cigarCount']
      ],
      include: [{
        model: Cigar,
        as: 'cigars',
        attributes: [],
        required: false
      }],
      group: ['Brand.id', 'Brand.name', 'Brand.image_key'],
      having: Sequelize.literal('COUNT("cigars"."id") > 0'),
      order: [
        [Sequelize.literal('AVG("cigars"."averageRating")'), 'DESC'],
        [Sequelize.literal('COUNT("cigars"."id")'), 'DESC']  // Secondary sort by cigar count
      ],
      subQuery: false
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
      const [[{ total }]] = await sequelize.query(`
        SELECT COUNT(*) as total
        FROM (
          SELECT "Brand"."id"
          FROM "Brands" AS "Brand"
          LEFT OUTER JOIN "Cigars" AS "cigars" ON "Brand"."id" = "cigars"."brand_id"
          GROUP BY "Brand"."id"
          HAVING COUNT("cigars"."id") > 0
        ) as counted
      `);
  
      const brands = await Brand.findAll(queryOptions);
  
      return {
        brands,
        currentPage: page,
        totalPages: Math.ceil(total / itemsPerPage),
        totalBrands: parseInt(total)
      };
    }
  
    // Just return brands
    return await Brand.findAll(queryOptions);
  };

  const getTrendingBrands = async (limit = null, skip = null, page = null, itemsPerPage = null) => {
    // Ensure limit is a number and has a maximum value
    const effectiveLimit = limit ? Math.min(parseInt(limit), 10) : null;
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
    const queryOptions = {
      attributes: [
        'id',
        'name',
        'image_key',
        [Sequelize.fn('AVG', Sequelize.col('cigars.averageRating')), 'avgRating'],
        [Sequelize.fn('COUNT', Sequelize.col('cigars.id')), 'cigarCount'],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::integer 
            FROM "Ratings" 
            WHERE "Ratings"."cigar_id" IN (
              SELECT "id" FROM "Cigars" WHERE "brand_id" = "Brand"."id"
            )
            AND "Ratings"."created_at" >= '${sevenDaysAgo.toISOString()}'
          )`),
          'recentRatingsCount'
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::integer 
            FROM "Reviews" 
            WHERE "Reviews"."cigar_id" IN (
              SELECT "id" FROM "Cigars" WHERE "brand_id" = "Brand"."id"
            )
            AND "Reviews"."created_at" >= '${sevenDaysAgo.toISOString()}'
          )`),
          'recentReviewsCount'
        ]
      ],
      include: [{
        model: Cigar,
        as: 'cigars',
        attributes: [],
        required: false
      }],
      group: ['Brand.id', 'Brand.name'],
      having: Sequelize.literal('COUNT("cigars"."id") > 0'),
      order: [
        [
          Sequelize.literal(`(
            (SELECT COUNT(*) FROM "Ratings" 
             WHERE "Ratings"."cigar_id" IN (
               SELECT "id" FROM "Cigars" WHERE "brand_id" = "Brand"."id"
             )
             AND "Ratings"."created_at" >= '${sevenDaysAgo.toISOString()}') +
            (SELECT COUNT(*) FROM "Reviews" 
             WHERE "Reviews"."cigar_id" IN (
               SELECT "id" FROM "Cigars" WHERE "brand_id" = "Brand"."id"
             )
             AND "Reviews"."created_at" >= '${sevenDaysAgo.toISOString()}')
          )`),
          'DESC'
        ]
      ],
      subQuery: false
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
      const [[{ total }]] = await sequelize.query(`
        SELECT COUNT(*) as total
        FROM (
          SELECT "Brand"."id"
          FROM "Brands" AS "Brand"
          LEFT OUTER JOIN "Cigars" AS "cigars" ON "Brand"."id" = "cigars"."brand_id"
          GROUP BY "Brand"."id"
          HAVING COUNT("cigars"."id") > 0
        ) as counted
      `);
  
      const brands = await Brand.findAll(queryOptions);
      const formattedBrands = brands.map(brand => {
        const brandData = brand.get({ plain: true });
        return {
          ...brandData,
          totalRecentInteractions: brandData.recentRatingsCount + brandData.recentReviewsCount
        };
      });
  
      return {
        brands: formattedBrands,
        currentPage: page,
        totalPages: Math.ceil(total / itemsPerPage),
        totalBrands: parseInt(total)
      };
    }
  
    // Just return formatted brands
    const brands = await Brand.findAll(queryOptions);
    return brands.map(brand => {
      const brandData = brand.get({ plain: true });
      return {
        ...brandData,
        totalRecentInteractions: brandData.recentRatingsCount + brandData.recentReviewsCount
      };
    });
  };

  router.get('/brands/all', async (req, res) => {
    try {
      console.log('Fetching all brands...');
      const brands = await Brand.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
        raw: true
      });
  
      console.log(`Successfully fetched ${brands.length} brands`);
      res.status(200).json({ brands });
    } catch (err) {
      console.error('Error fetching all brands:', err);
      res.status(500).json({ error: 'Failed to fetch brands', details: err.message });
    }
  });

// Route to fetch all brands (with pagination)
router.get('/brands', async (req, res) => {
  const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 21;  // Default to 21 brands per page
  const offset = (page - 1) * limit;  // Calculate the offset for pagination

  try {
    // Get total count of brands for pagination
    const [[{ total }]] = await sequelize.query(`
      SELECT COUNT(DISTINCT "Brand"."id") as total
      FROM "Brands" AS "Brand"
    `);

    // Fetch brands with aggregated data from cigars
    const { rows } = await Brand.findAndCountAll({
      attributes: [
        'id',
        'name',
        'image_key',
        [Sequelize.fn('COUNT', Sequelize.col('cigars.id')), 'cigarCount'],
        [Sequelize.fn('AVG', Sequelize.col('cigars.averageRating')), 'averageRating']
      ],
      include: [{
        model: Cigar,
        as: 'cigars',
        attributes: [],
        required: false
      }],
      group: ['Brand.id', 'Brand.name', 'Brand.image_key'],
      limit: limit,
      offset: offset,
      order: [['name', 'ASC']],
      subQuery: false
    });

    // Format the response
    const formattedBrands = rows.map(brand => {
      const plainBrand = brand.get({ plain: true });
      return {
        ...plainBrand,
        cigarCount: parseInt(plainBrand.cigarCount),
        averageRating: plainBrand.averageRating ? parseFloat(plainBrand.averageRating) : null
      };
    });

    // Respond with paginated brands and pagination metadata
    res.status(200).json({
      brands: formattedBrands,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBrands: parseInt(total)
    });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ error: 'Failed to fetch brands', details: err.message });
  }
});

router.get('/brands/alphabetical', async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const limit = parseInt(req.query.limit) || 100;

    const result = await getAlphabeticalBrands(cursor, limit);

    res.status(200).json({
      brands: result.items,
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage
    });
  } catch (err) {
    console.error('Error fetching alphabetical brands:', err);
    res.status(500).json({ 
      error: 'Failed to retrieve brands', 
      details: err.message 
    });
  }
});
  
// Route for home page (top 10)
router.get('/brands/top-rated', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;
    const topBrands = await getTopRatedBrands(limit, skip);
    res.json(topBrands);
  } catch (error) {
    console.error('Error fetching top-rated brands:', error);
    res.status(500).json({ error: 'Failed to fetch top-rated brands', details: error.message });
  }
});

// Route for full list with pagination
router.get('/brands/top-rated/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.limit) || 21;
    
    const result = await getTopRatedBrands(null, null, page, itemsPerPage);
    
    res.json({
      brands: result.brands,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBrands: result.totalBrands
    });
  } catch (error) {
    console.error('Error fetching all top-rated brands:', error);
    res.status(500).json({ error: 'Failed to fetch top-rated brands', details: error.message });
  }
});

// Route for home page (top 10)
router.get('/brands/trending', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;
    const trendingBrands = await getTrendingBrands(limit, skip);
    res.json(trendingBrands);
  } catch (error) {
    console.error('Error fetching trending brands:', error);
    res.status(500).json({ error: 'Failed to fetch trending brands', details: error.message });
  }
});

// Route for full list with pagination
router.get('/brands/trending/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.limit) || 21;
    
    const result = await getTrendingBrands(null, null, page, itemsPerPage);
    
    res.json({
      brands: result.brands,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBrands: result.totalBrands
    });
  } catch (error) {
    console.error('Error fetching all trending brands:', error);
    res.status(500).json({ error: 'Failed to fetch trending brands', details: error.message });
  }
});

// Route to fetch a single brand by ID
router.get('/brands/:id', async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);  // Fetch the brand by its primary key (ID)
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Respond with the found brand
    res.status(200).json(brand);
  } catch (err) {
    console.error('Error fetching brand:', err);
    res.status(500).json({ error: 'Failed to fetch brand', details: err.message });
  }
});

// Route to fetch cigars associated with a specific brand
router.get('/brands/:id/cigars', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    // Get total count first
    const count = await Cigar.count({
      where: { brand_id: req.params.id }
    });

    // Then fetch the paginated cigars
    const cigars = await Cigar.findAll({
      where: { brand_id: req.params.id },
      limit,
      offset,
      attributes: [
        'id',
        'name',
        'image_key',
        'averageRating',
        'numberOfRatings',
        'totalRatings',
        'total_bookmarks',
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
        'aging',
        'handmade',
        'description',
        'created_at',
        'updated_at'
      ],
      include: [{
        model: Brand,
        as: 'brand',
        attributes: ['id', 'name']
      }],
      order: [
        ['averageRating', 'DESC'],
        ['numberOfRatings', 'DESC'],
        ['name', 'ASC']
      ]
    });

    // Format the response data
    const formattedCigars = cigars.map(cigar => {
      const plainCigar = cigar.get({ plain: true });
      
      // Parse flavors if it's a string
      if (typeof plainCigar.flavors === 'string') {
        try {
          plainCigar.flavors = JSON.parse(plainCigar.flavors);
        } catch (e) {
          plainCigar.flavors = [];
        }
      }

      return {
        ...plainCigar,
        averageRating: plainCigar.averageRating ? parseFloat(plainCigar.averageRating) : 0,
        numberOfRatings: parseInt(plainCigar.numberOfRatings || 0),
        totalRatings: parseInt(plainCigar.totalRatings || 0),
        total_bookmarks: parseInt(plainCigar.total_bookmarks || 0)
      };
    });

    // Send response with pagination metadata
    res.status(200).json({
      cigars: formattedCigars,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalCigars: count,
      hasNextPage: page < Math.ceil(count / limit)
    });

  } catch (err) {
    console.error('Error fetching cigars for brand:', err);
    res.status(500).json({ 
      error: 'Failed to fetch cigars for this brand', 
      details: err.message 
    });
  }
});

// New route for non-paginated brand cigars specifically for the cigar bars
router.get('/brands/:id/other-cigars', async (req, res) => {
  try {
    const { excludeCigarId } = req.query; // Add this to exclude current cigar

    const cigars = await Cigar.findAll({
      where: { 
        brand_id: req.params.id,
        ...(excludeCigarId && { id: { [Op.ne]: excludeCigarId } })
      },
      attributes: [
        'id',
        'name',
        'image_key',
        'averageRating',
        'numberOfRatings',
        'totalRatings',
        'total_bookmarks',
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
        'aging',
        'handmade',
        'description',
        'created_at',
        'updated_at'
      ],
      include: [{
        model: Brand,
        as: 'brand',
        attributes: ['id', 'name']
      }],
      order: [
        ['averageRating', 'DESC'],
        ['numberOfRatings', 'DESC'],
        ['name', 'ASC']
      ],
    });

    // Format the response data
    const formattedCigars = cigars.map(cigar => {
      const plainCigar = cigar.get({ plain: true });
      
      // Parse flavors if it's a string
      if (typeof plainCigar.flavors === 'string') {
        try {
          plainCigar.flavors = JSON.parse(plainCigar.flavors);
        } catch (e) {
          plainCigar.flavors = [];
        }
      }

      return {
        ...plainCigar,
        averageRating: plainCigar.averageRating ? parseFloat(plainCigar.averageRating) : 0,
        numberOfRatings: parseInt(plainCigar.numberOfRatings || 0),
        totalRatings: parseInt(plainCigar.totalRatings || 0),
        total_bookmarks: parseInt(plainCigar.total_bookmarks || 0)
      };
    });

    res.status(200).json(formattedCigars);
  } catch (err) {
    console.error('Error fetching other cigars for brand:', err);
    res.status(500).json({
      error: 'Failed to fetch other cigars for this brand',
      details: err.message
    });
  }
});

// Route to add a new brand (with validation and image handling)
router.post('/brands', spacesUploadMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
      const { name, description } = req.body;

      // Validate that the brand name is provided and not empty
      if (!name || name.trim().length === 0) {
          if (req.processedImages?.brand) {
              await deleteImage(req.processedImages.brand.key);
          }
          await transaction.rollback();
          return res.status(400).json({ error: 'Brand name is required' });
      }

      // Prepare brand data
      const brandData = {
        name,
        description: description || null,
        image_key: req.processedImages?.brand?.key || null
      };

      // Create a new brand in the database
      const newBrand = await Brand.create(brandData, { transaction });
      
      await transaction.commit();
      res.status(201).json(newBrand);
  } catch (err) {
      await transaction.rollback();
      // Clean up the processed image if anything fails
      if (req.processedImages?.brand) {
        try {
            await deleteImage(req.processedImages.brand.key);
            console.log('Cleaned up processed image after failed brand creation');
        } catch (deleteErr) {
            console.error('Error deleting processed image:', deleteErr);
        }
      }
      console.error('Error creating brand:', err);
      res.status(400).json({ error: 'Failed to create brand', details: err.message });
  }
});


module.exports = router;