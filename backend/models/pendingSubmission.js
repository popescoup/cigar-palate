// models/pendingSubmission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./user');
const Brand = require('./brand');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// Utility function to safely delete a file
const safeDeleteFile = async (filePath) => {
    try {
        if (filePath) {
            const fullPath = path.join(process.cwd(), filePath);
            await fsPromises.access(fullPath);
            await fsPromises.unlink(fullPath);
            console.log(`Successfully deleted file: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
        // Don't throw - we want to continue even if file deletion fails
    }
};

const PendingSubmission = sequelize.define('PendingSubmission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Cigar Details
    cigar_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 100],
            notEmpty: true
        }
    },
    image_path: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /\.(jpg|jpeg|png)$/,
            validPath(value) {
                if (!value.startsWith('uploads/')) {
                    throw new Error('Image path must be in uploads directory');
                }
            }
        }
    },
    flavors: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 255],
            notEmpty: true
        },
        get() {
            const value = this.getDataValue('flavors');
            try {
                return JSON.parse(value);
            } catch (e) {
                return value?.split(',').map(f => f.trim()) || [];
            }
        },
        set(value) {
            if (Array.isArray(value)) {
                this.setDataValue('flavors', JSON.stringify(value));
            } else if (typeof value === 'string') {
                try {
                    JSON.parse(value); // Validate if it's already JSON
                    this.setDataValue('flavors', value);
                } catch (e) {
                    this.setDataValue('flavors', 
                        JSON.stringify(value.split(',').map(f => f.trim()))
                    );
                }
            }
        }
    },
    shape: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    size: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    wrap_type: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    filler: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    country_of_origin: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    aging: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0
        }
    },
    handmade: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 500]
        }
    },
    dimensions: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    made_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    price_range: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            isIn: {
                args: [['<$10', '$10.01 - $25', '$25.01 - $50', '$50.01 - $75', '$75.01 - $100', '$100.01<']],
                msg: 'Invalid price range'
            }
        }
    },
    strength: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    binder: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    // Brand Details
    brand_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Brand,
            key: 'id'
        }
    },
    new_brand_name: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 50]
        }
    },
    // New Brand Fields
    new_brand_image_path: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            is: /\.(jpg|jpeg|png)$/,
            validPath(value) {
                if (value && !value.startsWith('uploads/')) {
                    throw new Error('Brand image path must be in uploads directory');
                }
            }
        }
    },
    new_brand_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 500]
        }
    },
    // Submission Details
    submitter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    admin_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000]
        }
    },
    submission_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    review_date: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'PendingSubmissions',
    validate: {
        async brandValidation() {
            if (!this.brand_id && !this.new_brand_name) {
                throw new Error('Must provide either existing brand or new brand name');
            }
            if (this.brand_id && this.new_brand_name) {
                throw new Error('Cannot provide both existing brand and new brand');
            }
            if (this.new_brand_name) {
                const existingBrand = await Brand.findOne({
                    where: { name: this.new_brand_name }
                });
                if (existingBrand) {
                    this.brand_id = existingBrand.id;
                    this.new_brand_name = null;
                    this.new_brand_image_path = null;
                    this.new_brand_description = null;
                }
                // Validate new brand requirements
                else if (!this.new_brand_image_path || !this.new_brand_description) {
                    throw new Error('New brands require both an image and description');
                }
            }
        }
    },
    hooks: {
        // Add this new hook first
        beforeCreate: async (submission) => {
            console.log('Before Create Hook - Data:', {
                price_range: submission.price_range,
                strength: submission.strength,
                binder: submission.binder,
                allData: submission.dataValues
            });
        },
        
        // Your existing beforeValidate hook
        beforeValidate: async (submission) => {
            const checkFile = async (filePath) => {
                if (filePath) {
                    // Only check if path is properly formatted
                    if (!filePath.startsWith('uploads/')) {
                        throw new Error(`Invalid file path format: ${filePath}`);
                    }
                }
            };
    
            await checkFile(submission.image_path);
            await checkFile(submission.new_brand_image_path);
        }
    }
});

// Delete associated files when submission is deleted
PendingSubmission.addHook('beforeDestroy', async (submission, options) => {
    // Skip file deletion during approval process
    if (options.hooks === false) {
        console.log('Skipping file deletion during approval');
        return;
    }

    try {
        if (submission.image_path) {
            await safeDeleteFile(submission.image_path);
            console.log('Deleted cigar image:', submission.image_path);
        }
        
        if (submission.new_brand_image_path) {
            await safeDeleteFile(submission.new_brand_image_path);
            console.log('Deleted brand image:', submission.new_brand_image_path);
        }
    } catch (error) {
        console.error('Error in beforeDestroy hook:', error);
    }
});

// Approve method
PendingSubmission.prototype.approve = async function(adminId, transaction = null) {
    const t = transaction || await sequelize.transaction();
    
    try {
        console.log('Starting approval process for submission:', this.id);
        
        // Create brand first (if needed)
        let brandId = this.brand_id;
        if (this.new_brand_name) {
            console.log('Creating new brand:', {
                name: this.new_brand_name,
                image_path: this.new_brand_image_path
            });

            // Copy brand image before creating brand
            if (this.new_brand_image_path) {
                console.log('Keeping brand image:', this.new_brand_image_path);
            }

            const [newBrand] = await Brand.findOrCreate({
                where: { name: this.new_brand_name },
                defaults: {
                    name: this.new_brand_name,
                    image_path: this.new_brand_image_path,
                    description: this.new_brand_description
                },
                transaction: t
            });
            brandId = newBrand.id;
        }

        // Create cigar with flavor handling
        console.log('Keeping cigar image:', this.image_path);
        const approvedCigar = await sequelize.models.Cigar.create({
            name: this.cigar_name,
            brand_id: brandId,
            image_path: this.image_path,
            // Updated flavor handling
            flavors: Array.isArray(this.flavors) 
                ? JSON.stringify(this.flavors)
                : Array.isArray(JSON.parse(this.flavors))
                    ? this.flavors
                    : JSON.stringify(this.flavors.split(',').map(f => f.trim())),
            shape: this.shape,
            size: this.size,
            color: this.color,
            wrap_type: this.wrap_type,
            filler: this.filler,
            country_of_origin: this.country_of_origin,
            aging: this.aging,
            handmade: this.handmade,
            description: this.description,
            price_range: this.price_range,
            strength: this.strength,
            binder: this.binder,
            dimensions: this.dimensions,
            made_by: this.made_by,
            // Default values for new cigars
            totalRatings: 0,
            numberOfRatings: 0,
            averageRating: 0,
            total_bookmarks: 0
        }, { transaction: t });

        // Increment submitter's reputation
        await sequelize.models.User.increment('reputation', {
            by: 10,
            where: { id: this.submitter_id },
            transaction: t
        });

        // Update submission status
        await this.update({
            admin_id: adminId,
            review_date: new Date()
        }, { transaction: t });

        // Delete the submission (with hooks disabled to prevent file deletion)
        await PendingSubmission.destroy({
            where: { id: this.id },
            transaction: t,
            hooks: false
        });

        if (!transaction) {
            await t.commit();
        }

        return approvedCigar;
    } catch (error) {
        console.error('Error in approve method:', error);
        if (!transaction) {
            await t.rollback();
        }
        throw error;
    }
};

// Decline method
PendingSubmission.prototype.decline = async function(adminId, notes = null, transaction = null) {
    const t = transaction || await sequelize.transaction();
    
    try {
        console.log('Declining submission:', this.id);
        
        // Update admin information
        await this.update({
            admin_id: adminId,
            admin_notes: notes,
            review_date: new Date()
        }, { transaction: t });

        // Store paths for logging
        const imagePath = this.image_path;
        const brandImagePath = this.new_brand_image_path;

        // Delete the submission (will trigger beforeDestroy hook for file cleanup)
        await this.destroy({ transaction: t });

        if (!transaction) {
            await t.commit();
        }

        console.log('Successfully declined submission. Cleaned up files:', {
            cigar: imagePath,
            brand: brandImagePath
        });
    } catch (error) {
        console.error('Error in decline method:', error);
        if (!transaction) {
            await t.rollback();
        }
        throw error;
    }
};

// Associations
PendingSubmission.belongsTo(User, {
    foreignKey: 'submitter_id',
    as: 'submitter'
});

PendingSubmission.belongsTo(User, {
    foreignKey: 'admin_id',
    as: 'reviewer'
});

PendingSubmission.belongsTo(Brand, {
    foreignKey: 'brand_id',
    as: 'brand'
});

module.exports = PendingSubmission;