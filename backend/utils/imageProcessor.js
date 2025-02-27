// imageProcessor.js
const sharp = require('sharp');

class ImageProcessor {
  constructor(options = {}) {
    this.maxWidth = options.maxWidth || 900;
    this.maxHeight = options.maxHeight || 900;
  }

  async processImage(inputBuffer, originalFilename) {
    try {
      // Log input details
      console.log('Processing image:', {
        filename: originalFilename,
        originalSize: (inputBuffer.length / 1024).toFixed(2) + ' KB'
      });

      // Validate input buffer
      if (!Buffer.isBuffer(inputBuffer)) {
        throw new Error('Invalid input: Expected a Buffer');
      }

      // Validate file content
      if (inputBuffer.length === 0) {
        throw new Error('Invalid input: Empty buffer');
      }

      // Get image metadata and validate it's an actual image
      const metadata = await sharp(inputBuffer).metadata();
      if (!metadata.width || !metadata.height || !metadata.format) {
        throw new Error('Invalid image file: Unable to read image dimensions or format');
      }

      // Log original dimensions and format
      console.log('Original image metadata:', {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      });

      const { width: newWidth, height: newHeight } = this.calculateDimensions(
        metadata.width,
        metadata.height
      );

      // Log calculated dimensions
      console.log('Calculated new dimensions:', {
        width: newWidth,
        height: newHeight
      });

      const processedBuffer = await sharp(inputBuffer)
        .rotate() // Preserve rotation metadata
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();

      // Log processing results
      console.log('Image processing complete:', {
        filename: originalFilename,
        originalSize: (inputBuffer.length / 1024).toFixed(2) + ' KB',
        processedSize: (processedBuffer.length / 1024).toFixed(2) + ' KB',
        dimensions: {
          original: `${metadata.width}x${metadata.height}`,
          processed: `${newWidth}x${newHeight}`
        }
      });

      return {
        buffer: processedBuffer,
        width: newWidth,
        height: newHeight,
        size: processedBuffer.length,
        format: metadata.format
      };
    } catch (error) {
      // Log error details
      console.error('Image processing error:', {
        filename: originalFilename,
        error: error.message
      });

      if (error.message.includes('Input buffer contains unsupported image format')) {
        throw new Error('Unsupported image format. Please upload a JPEG or PNG file.');
      } else if (error.message.includes('Input buffer is corrupt')) {
        throw new Error('The uploaded file appears to be corrupted. Please try uploading again.');
      }
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  calculateDimensions(originalWidth, originalHeight) {
    // Existing calculation logic remains the same
    if (originalWidth <= this.maxWidth && originalHeight <= this.maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > originalHeight) {
      return {
        width: this.maxWidth,
        height: Math.round(this.maxWidth / aspectRatio)
      };
    } else {
      return {
        width: Math.round(this.maxHeight * aspectRatio),
        height: this.maxHeight
      };
    }
  }
}

module.exports = ImageProcessor;