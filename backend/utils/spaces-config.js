// utils/spaces-config.js
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { AppError } = require('../middleware/errorHandler');
const ImageProcessor = require('./imageProcessor');

// Initialize the image processor
const imageProcessor = new ImageProcessor({
  maxWidth: 900,
  maxHeight: 900
});

// Configure the S3 (Spaces) client
const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_KEY,
  secretAccessKey: process.env.SPACES_SECRET,
  region: process.env.SPACES_ENDPOINT.split('.')[0] // Extract region from endpoint
});

// Configure storage for multer-s3 with image processing
const storageS3 = multerS3({
  s3: s3,
  bucket: process.env.SPACES_NAME,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const fileName = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
  shouldTransform: function(req, file, cb) {
    cb(null, true); // Always transform
  },
  transforms: [{
    id: 'processed',
    key: function(req, file, cb) {
      const fileName = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, fileName);
    },
    transform: function(req, file, cb) {
      imageProcessor.processImage(file.buffer, file.originalname)
        .then(processed => {
          console.log('Processed image details:', {
            filename: file.originalname,
            originalSize: (file.size / 1024).toFixed(2) + ' KB',
            processedSize: (processed.size / 1024).toFixed(2) + ' KB',
            dimensions: {
              width: processed.width,
              height: processed.height
            }
          });
          cb(null, processed.buffer);
        })
        .catch(err => {
          console.error('Image processing error:', err);
          cb(new Error(`Image processing failed: ${err.message}`));
        });
    }
  }]
});

// File filter - only allow image files
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new AppError('Only images (jpeg, jpg, png) are allowed', 400));
};

// Configure the upload middleware for Spaces
const uploadToSpaces = (fieldConfig) => {
  return multer({
    storage: storageS3,
    fileFilter: fileFilter,
    limits: {
      fileSize: 3.5 * 1024 * 1024 // 3.5MB limit
    }
  }).fields(fieldConfig);
};

// Helper to generate the public URL for an image
const getImageUrl = (key) => {
  if (process.env.SPACES_CDN_ENDPOINT) {
    return `https://${process.env.SPACES_CDN_ENDPOINT}/${key}`;
  }
  return `https://${process.env.SPACES_NAME}.${process.env.SPACES_ENDPOINT}/${key}`;
};

// Delete an image from Spaces
const deleteImage = async (key) => {
  try {
    await s3.deleteObject({
      Bucket: process.env.SPACES_NAME,
      Key: key
    }).promise();
    
    console.log('Successfully deleted image from Spaces:', key);
    return true;
  } catch (error) {
    console.error('Error deleting image from Spaces:', error);
    throw new AppError(`Failed to delete image from storage: ${error.message}`, 500);
  }
};

module.exports = {
  s3,
  uploadToSpaces,
  getImageUrl,
  deleteImage
};