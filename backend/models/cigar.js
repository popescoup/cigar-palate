// backend/models/cigar.js

/*
Defines a Cigar model using Sequelize, for a Node.js application.
Features:
- Complete cigar information storage and validation
- Relationships with brands, reviews, users, and forum components
- Foreign key integrity enforcement
- Comprehensive field validation
- Performance-optimized indexing
- Brand validation and creation handling
- Interaction tracking
- Forum integration with polymorphic voting system
*/

const { DataTypes } = require('sequelize');
const sequelize = require('../config');

// Core business models
const Brand = require('./brand');
const User = require('./user');
const Review = require('./review');
const FlavorRanking = require('./flavorRanking');
const Bookmark = require('./bookmark');
const Rating = require('./rating');
const ThreadBookmark = require('./ThreadBookmark');
const Follow = require('./follow');
const Notification = require('./notification');

// Forum system models
const Thread = require('./thread');
const Reply = require('./reply');
const Tag = require('./tag');
const ThreadTag = require('./threadTag');
const Vote = require('./vote');

// Define the Cigar model
const Cigar = sequelize.define('Cigar', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 100],
        },
        index: true,
    },
    image_path: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /\.(jpg|jpeg|png)$/,
        },
    },
    brand_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Brand,
            key: 'id',
        },
        index: true,
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
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        },
        index: true
    },
    color: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        },
        index: true
    },
    wrap_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        },
        index: true
    },
    filler: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    country_of_origin: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [1, 100],
        },
        index: true, // Add index for filtering by country
    },
    aging: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    handmade: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 500],
            notEmpty: true
        },
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
        },
        index: true
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
    // Rating and interaction tracking
    totalRatings: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        index: true, // Add index for sorting by popularity
    },
    numberOfRatings: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    averageRating: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        index: true, // Add index for sorting by rating
    },
    total_bookmarks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        index: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    validate: {
        async ensureBrandOrNewBrand() {
            if (!this.brand_id && !this.new_brand) {
                throw new Error('You must provide either an existing brand or a new brand.');
            }
            if (this.brand_id && this.new_brand) {
                throw new Error('You cannot provide both an existing brand and a new brand.');
            }
            if (!this.brand_id && this.new_brand) {
                if (this.new_brand.length < 1 || this.new_brand.length > 50) {
                    throw new Error('New brand name must be between 1 and 50 characters.');
                }
                const existingBrand = await Brand.findOne({ 
                    where: { name: this.new_brand },
                    transaction: this.sequelize.transaction()
                });
                if (existingBrand) {
                    this.brand_id = existingBrand.id;
                } else {
                    const newBrand = await Brand.create({ 
                        name: this.new_brand 
                    }, { 
                        transaction: this.sequelize.transaction() 
                    });
                    this.brand_id = newBrand.id;
                }
            }
        }
    },
    
    indexes: [
        // Composite indexes for common query patterns
        {
            fields: ['brand_id', 'name'],
            name: 'cigar_brand_name_idx'
        },
        {
            fields: ['averageRating'],
            name: 'cigar_rating_idx'
        },
        {
            fields: ['created_at', 'brand_id'],
            name: 'cigar_brand_date_idx'
        },
        // Full-text search index for name and description
        {
            fields: ['name', 'description'],
            type: 'FULLTEXT',
            name: 'cigar_search_idx'
        }, 
        {
            fields: ['total_bookmarks'],
            name: 'cigar_bookmarks_idx'
        }
    ]
});

// ===================================
// Model Associations
// ===================================

// Core business associations
Cigar.belongsTo(Brand, { 
    foreignKey: 'brand_id', 
    as: 'brand', 
    onDelete: 'RESTRICT' 
});

Brand.hasMany(Cigar, { 
    foreignKey: 'brand_id', 
    as: 'cigars', 
    onDelete: 'RESTRICT' 
});

Cigar.hasMany(Review, { 
    foreignKey: 'cigar_id', 
    as: 'reviews',
    onDelete: 'CASCADE'
});

Review.belongsTo(Cigar, { 
    foreignKey: 'cigar_id', 
    as: 'cigar' 
});

Cigar.hasMany(FlavorRanking, { 
    foreignKey: 'cigarId',
    onDelete: 'CASCADE'
});

FlavorRanking.belongsTo(Cigar, { 
    foreignKey: 'cigarId', 
    as: 'cigar' 
});

FlavorRanking.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

User.hasMany(FlavorRanking, {
    foreignKey: 'userId',
    as: 'flavorRankings'
});

// User associations
Review.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
});

User.hasMany(Review, { 
    foreignKey: 'user_id', 
    as: 'reviews' 
});

// Forum content associations
Thread.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
});

User.hasMany(Thread, { 
    foreignKey: 'user_id', 
    as: 'threads' 
});

Reply.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
});

User.hasMany(Reply, { 
    foreignKey: 'user_id', 
    as: 'replies' 
});

User.hasMany(Rating, {
    foreignKey: 'user_id',
    as: 'ratings'
});

Rating.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

Reply.belongsTo(Thread, { 
    foreignKey: 'thread_id', 
    as: 'thread' 
});

Thread.hasMany(Reply, { 
    foreignKey: 'thread_id', 
    as: 'replies',
    onDelete: 'CASCADE'
});

Thread.belongsToMany(User, {
    through: ThreadBookmark,
    foreignKey: 'thread_id',
    otherKey: 'user_id',
    as: 'bookmarkedBy',
    onDelete: 'CASCADE'  // Delete bookmarks when thread is deleted
});

User.belongsToMany(Thread, {
    through: ThreadBookmark,
    foreignKey: 'user_id',
    otherKey: 'thread_id',
    as: 'bookmarkedThreads'
});

// Follow associations
User.belongsToMany(User, {
    through: 'Follow',
    as: 'followers',
    foreignKey: 'following_id',
    otherKey: 'follower_id'
});

User.belongsToMany(User, {
    through: 'Follow',
    as: 'following',
    foreignKey: 'follower_id',
    otherKey: 'following_id'
});
  
  // Notification associations
  User.hasMany(Notification, {
    foreignKey: 'user_id',
    as: 'notifications'
  });
  
  Notification.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  Notification.belongsTo(User, {
    foreignKey: 'actor_id',
    as: 'actor'
  });

// Forum tagging system
Thread.belongsToMany(Tag, { 
    through: {
        model: ThreadTag,
        unique: false
    },
    foreignKey: 'thread_id',
    otherKey: 'tag_id',
    as: 'tags'
});

Tag.belongsToMany(Thread, { 
    through: {
        model: ThreadTag,
        unique: false
    },
    foreignKey: 'tag_id',
    otherKey: 'thread_id',
    as: 'threads'
});

Cigar.hasMany(Rating, {
    foreignKey: 'cigar_id',
    as: 'ratings',
    onDelete: 'CASCADE'
});

Rating.belongsTo(Cigar, {
    foreignKey: 'cigar_id',
    as: 'cigar'
});

// Forum voting system (polymorphic)
Thread.hasMany(Vote, {
    foreignKey: 'voteable_id',
    constraints: false,
    scope: {
        voteable_type: 'thread'
    },
    as: 'votes',
    onDelete: 'CASCADE'
});

Reply.hasMany(Vote, {
    foreignKey: 'voteable_id',
    constraints: false,
    scope: {
        voteable_type: 'reply'
    },
    as: 'votes',
    onDelete: 'CASCADE'
});

// Review-Vote relationship
Review.hasMany(Vote, {
    foreignKey: 'voteable_id',
    constraints: false,
    scope: {
        voteable_type: 'review'
    },
    as: 'votes',
    onDelete: 'CASCADE'
});

Vote.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
});

User.hasMany(Vote, { 
    foreignKey: 'user_id', 
    as: 'votes' 
});

// Bookmark relationships
Cigar.belongsToMany(User, {
    through: Bookmark,
    foreignKey: 'cigar_id',
    otherKey: 'user_id',
    as: 'bookmarkedBy',
    onDelete: 'CASCADE'  // Delete bookmarks when cigar is deleted
});

User.belongsToMany(Cigar, {
    through: Bookmark,
    foreignKey: 'user_id',
    otherKey: 'cigar_id',
    as: 'bookmarkedCigars'
});

ThreadBookmark.belongsTo(Thread, {
    foreignKey: 'thread_id',
    as: 'thread'
});

ThreadBookmark.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

Thread.hasMany(ThreadBookmark, {
    foreignKey: 'thread_id',
    as: 'bookmarks'
});

User.hasMany(ThreadBookmark, {
    foreignKey: 'user_id',
    as: 'threadBookmarks'
});

module.exports = Cigar;