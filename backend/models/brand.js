// backend/models/brand.js

/*
Defines the Brand model using Sequelize.
The model represents a database table for storing information about brands.
*/

const { DataTypes } = require('sequelize');
const sequelize = require('../config');  // Import the Sequelize instance to connect to the database
const fsPromises = require('fs').promises;
const path = require('path');
const fs = require('fs');

// Define the Brand model
const Brand = sequelize.define('Brand', {
    // Brand name: required, must be unique, and must be between 1 and 50 characters
    name: {
        type: DataTypes.STRING,
        allowNull: false,  // Name is required
        unique: true,  // Name must be unique across all brands
        validate: {
            len: [1, 50],  // Ensure the brand name is between 1 and 50 characters
        },
    },
    image_key: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            is: /^image-[0-9]+-[0-9]+\.(jpg|jpeg|png)$/i
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 500]
        }
    }
}, {
    // Enable automatic timestamping for created_at and updated_at fields
    timestamps: true,
    createdAt: 'created_at',  // Map Sequelize's createdAt to 'created_at' in the database
    updatedAt: 'updated_at',  // Map Sequelize's updatedAt to 'updated_at' in the database

    // Add an index on the name field for faster queries
    indexes: [
        {
            unique: true,  // Ensure uniqueness for the name
            fields: ['name'],  // Index on the name field
        }
    ],
});

Brand.addHook('beforeDestroy', async (brand, options) => {
    if (brand.image_key) {
        try {
            // Dynamic import to avoid circular dependencies
            const { deleteImage } = require('../utils/spaces-config');
            await deleteImage(brand.image_key);
            console.log(`Successfully deleted brand image from Spaces: ${brand.image_key}`);
        } catch (error) {
            console.error(`Error deleting brand image ${brand.image_key}:`, error);
            // Don't throw - we want to continue even if file deletion fails
        }
    }
});

// Add URL getters for image paths
Brand.prototype.getImageUrl = function() {
    // Dynamically import to avoid circular dependencies
    const { getImageUrl } = require('../utils/spaces-config');
    
    if (!this.image_key) return null;
    return getImageUrl(this.image_key);
};
  
// Add toJSON method to include URL in API responses
Brand.prototype.toJSON = function() {
    const values = { ...this.get() };
    
    // Add image URL to the response
    values.image_url = this.getImageUrl();
    
    return values;
};



module.exports = Brand;