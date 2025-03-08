// middleware/spacesUploadMiddleware.js
const { uploadToSpaces, getImageUrl } = require('../utils/spaces-config');

const spacesUploadMiddleware = (req, res, next) => {
  // Add a new field for thread_image
  uploadToSpaces([
    { name: 'image', maxCount: 1 },
    { name: 'brand_image', maxCount: 1 },
    { name: 'thread_image', maxCount: 1 } // New field for thread images
  ])(req, res, function(err) {
    if (err) {
      console.error('Image upload error:', err);
      return res.status(400).json({
        error: 'File upload failed',
        details: err.message
      });
    }
    
    try {
      req.processedImages = {};
      
      // Handle cigar image (existing logic - untouched)
      if (req.files['image'] && req.files['image'][0]) {
        const cigarImage = req.files['image'][0];
        
        req.processedImages.cigar = {
          key: cigarImage.key,
          dimensions: {
            width: cigarImage.width || 900,
            height: cigarImage.height || 900
          },
          url: getImageUrl(cigarImage.key)
        };
        
        console.log('Processed cigar image details:', {
          key: cigarImage.key,
          url: getImageUrl(cigarImage.key)
        });
      }
      
      // Handle brand image (existing logic - untouched)
      if (req.files['brand_image'] && req.files['brand_image'][0]) {
        const brandImage = req.files['brand_image'][0];
        
        req.processedImages.brand = {
          key: brandImage.key,
          dimensions: {
            width: brandImage.width || 900,
            height: brandImage.height || 900
          },
          url: getImageUrl(brandImage.key)
        };
        
        console.log('Processed brand image details:', {
          key: brandImage.key,
          url: getImageUrl(brandImage.key)
        });
      }

      // New logic for thread images
      if (req.files['thread_image'] && req.files['thread_image'][0]) {
        const threadImage = req.files['thread_image'][0];
        
        req.processedImages.thread = {
          key: threadImage.key,
          dimensions: {
            width: threadImage.width || 900,
            height: threadImage.height || 900
          },
          url: getImageUrl(threadImage.key)
        };
        
        console.log('Processed thread image details:', {
          key: threadImage.key,
          url: getImageUrl(threadImage.key)
        });
      } else if (req.originalUrl.includes('/threads') && req.files['image'] && req.files['image'][0]) {
        // Alternative approach: If on a thread route and using the regular 'image' field,
        // also add it as a thread image
        const image = req.files['image'][0];
        
        req.processedImages.thread = {
          key: image.key,
          dimensions: {
            width: image.width || 900,
            height: image.height || 900
          },
          url: getImageUrl(image.key)
        };
        
        console.log('Using image as thread image:', {
          key: image.key,
          url: getImageUrl(image.key)
        });
      }
      
      next();
    } catch (error) {
      console.error('Error processing uploaded images:', error);
      return res.status(500).json({
        error: 'Image processing failed',
        details: error.message
      });
    }
  });
};

module.exports = spacesUploadMiddleware;