// backend/models/brand.js

/*
Defines the Brand model using Sequelize.
The model represents a database table for storing information about brands.
*/

const { DataTypes } = require('sequelize');
const sequelize = require('../config');  // Import the Sequelize instance to connect to the database
const fsPromises = require('fs').promises;
const path = require('path');

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
    image_path: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            is: /\.(jpg|jpeg|png)$/
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
    if (brand.image_path) {
        try {
            await fsPromises.unlink(path.join(process.cwd(), brand.image_path));
            console.log('Successfully deleted brand image:', brand.image_path);
        } catch (error) {
            console.error('Error deleting brand image:', error);
            // Don't throw error for cleanup failure
        }
    }
});

module.exports = Brand;