// models/review.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Review = sequelize.define('Review', {
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 5000],
    }
  },
  vote_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  cigar_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Cigars',
      key: 'id',
    },
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Reviews',
      key: 'id'
    },
  },
  path: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Stores the full path of parent IDs for efficient tree traversal'
  },
  depth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      max: 3
    }
  },
  reply_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  is_edited: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['vote_count'],
      name: 'reviews_vote_count_idx'
    },
    {
      fields: ['cigar_id', 'created_at'],
      name: 'reviews_cigar_date_idx'
    },
    {
      fields: ['parent_id'],
      name: 'reviews_parent_id_idx'
    },
    {
      fields: ['path'],
      name: 'reviews_path_idx'
    },
    {
      fields: ['depth'],
      name: 'reviews_depth_idx'
    },
    {
      fields: ['is_deleted'],
      name: 'reviews_is_deleted_idx'
    }
  ],
  hooks: {
    beforeCreate: async (review, options) => {
        if (review.parent_id) {
            const parentReview = await Review.findByPk(review.parent_id, {
                transaction: options.transaction
            });
            
            if (!parentReview) {
                throw new Error('Parent review not found');
            }
            
            review.path = parentReview.path 
                ? `${parentReview.path}.${parentReview.id}`
                : parentReview.id.toString();
            review.depth = (parentReview.path ? parentReview.path.split('.').length : 0) + 1;
            
            if (review.depth > 5) {
                throw new Error('Maximum reply depth exceeded');
            }

            // Use the same transaction for incrementing
            await Review.increment('reply_count', {
                where: { id: review.parent_id },
                transaction: options.transaction
            });
        } else {
            review.path = null;
            review.depth = 0;
        }
    },
    
    beforeDestroy: async (review, options) => {
        // Only run this hook if not being handled by the delete route
        if (!options.hooks === false && review.parent_id) {
            await Review.decrement('reply_count', {
                where: { id: review.parent_id },
                transaction: options.transaction
            });
        }
    }
}
});

// Association with itself for replies
Review.hasMany(Review, {
  as: 'replies',
  foreignKey: 'parent_id',
  onDelete: 'CASCADE'
});

Review.belongsTo(Review, {
  as: 'parent',
  foreignKey: 'parent_id'
});

// Instance methods
Review.prototype.getRepliesTree = async function(options = {}) {
  const { limit = 10, offset = 0, sort = 'newest' } = options;
  
  let order;
  switch (sort) {
    case 'oldest':
      order = [['created_at', 'ASC']];
      break;
    case 'mostLiked':
      order = [['vote_count', 'DESC']];
      break;
    default: // 'newest'
      order = [['created_at', 'DESC']];
  }

  return await Review.findAll({
    where: {
      path: {
        [sequelize.Op.like]: `${this.path ? this.path + '.' : ''}${this.id}%`
      }
    },
    order,
    limit,
    offset
  });
};

Review.prototype.updatePath = async function() {
  if (this.parent_id) {
    const parent = await Review.findByPk(this.parent_id);
    if (parent) {
      this.path = parent.path 
        ? `${parent.path}.${parent.id}`
        : parent.id.toString();
      this.depth = (parent.path ? parent.path.split('.').length : 0) + 1;
      await this.save();
    }
  }
};

// Static methods
Review.getRootReviews = function(cigarId, options = {}) {
  const { limit = 10, offset = 0, sort = 'newest' } = options;
  
  let order;
  switch (sort) {
    case 'oldest':
      order = [['created_at', 'ASC']];
      break;
    case 'mostLiked':
      order = [['vote_count', 'DESC']];
      break;
    default: // 'newest'
      order = [['created_at', 'DESC']];
  }

  return Review.findAndCountAll({
    where: {
      cigar_id: cigarId,
      parent_id: null
    },
    order,
    limit,
    offset
  });
};

module.exports = Review;