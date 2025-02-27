// multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ImageProcessor = require('../utils/imageProcessor');

const imageProcessor = new ImageProcessor({
  maxWidth: 900,
  maxHeight: 900
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images (jpeg, jpg, png) are allowed'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 3.5 * 1024 * 1024  // 3.5MB limit
  }
});

const processAndSaveImage = async (file, uploadDir, filename) => {
  try {
    const processed = await imageProcessor.processImage(file.buffer, file.originalname);
    await fs.mkdir(uploadDir, { recursive: true });
    const imagePath = path.join(uploadDir, filename);
    await fs.writeFile(imagePath, processed.buffer);
    
    return {
      path: filename,
      dimensions: {
        width: processed.width,
        height: processed.height
      }
    };
  } catch (error) {
    throw new Error(`Failed to process and save image: ${error.message}`);
  }
};

module.exports = {
  upload,
  processAndSaveImage
};