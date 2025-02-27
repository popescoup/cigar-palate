// migrations/YYYYMMDDHHMMSS-add-cigar-indexes.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add indexes individually to better handle potential errors
    try {
      // Single column indexes
      await queryInterface.addIndex('Cigars', ['name'], {
        name: 'cigars_name_idx'
      });

      await queryInterface.addIndex('Cigars', ['size'], {
        name: 'cigars_size_idx'
      });

      await queryInterface.addIndex('Cigars', ['color'], {
        name: 'cigars_color_idx'
      });

      await queryInterface.addIndex('Cigars', ['wrap_type'], {
        name: 'cigars_wrap_type_idx'
      });

      await queryInterface.addIndex('Cigars', ['country_of_origin'], {
        name: 'cigars_country_idx'
      });

      await queryInterface.addIndex('Cigars', ['totalRatings'], {
        name: 'cigars_total_ratings_idx'
      });

      await queryInterface.addIndex('Cigars', ['averageRating'], {
        name: 'cigars_avg_rating_idx'
      });

      await queryInterface.addIndex('Cigars', ['totalInteractions'], {
        name: 'cigars_interactions_idx'
      });

      await queryInterface.addIndex('Cigars', ['lastInteractionDate'], {
        name: 'cigars_last_interaction_idx'
      });

      await queryInterface.addIndex('Cigars', ['created_at'], {
        name: 'cigars_created_at_idx'
      });

      // Composite indexes
      await queryInterface.addIndex('Cigars', ['brand_id', 'name'], {
        name: 'cigar_brand_name_idx'
      });

      await queryInterface.addIndex('Cigars', ['averageRating', 'totalInteractions'], {
        name: 'cigar_popularity_idx'
      });

      await queryInterface.addIndex('Cigars', ['created_at', 'brand_id'], {
        name: 'cigar_brand_date_idx'
      });

      // Full-text search index (if using MySQL)
      if (queryInterface.sequelize.dialect.name === 'mysql') {
        await queryInterface.sequelize.query(`
          ALTER TABLE Cigars 
          ADD FULLTEXT INDEX cigar_search_idx (name, description);
        `);
      }
      // For PostgreSQL, you might want to use GiST or GIN indexes instead
      else if (queryInterface.sequelize.dialect.name === 'postgres') {
        await queryInterface.sequelize.query(`
          CREATE INDEX cigar_search_idx ON "Cigars" 
          USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
        `);
      }

    } catch (error) {
      console.error('Error adding indexes:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes in reverse order
    try {
      await queryInterface.removeIndex('Cigars', 'cigars_name_idx');
      await queryInterface.removeIndex('Cigars', 'cigars_size_idx');
      await queryInterface.removeIndex('Cigars', 'cigars_color_idx');
      await queryInterface.removeIndex('Cigars', 'cigars_wrap_type_idx');
      await queryInterface.removeIndex('Cigars', 'cigars_country_idx');
      await queryInterface.removeIndex('Cigars', 'cigars_total_ratings_idx');
      await queryInterface.removeIndex('Cigars', 'cigars_avg_rating_idx');
      await queryInterface.removeIndex('Cigars', 'cigars_interactions_idx');
      await queryInterface.removeIndex('Cigars', 'cigars_last_interaction_idx');
      await queryInterface.removeIndex('Cigars', 'cigars_created_at_idx');
      await queryInterface.removeIndex('Cigars', 'cigar_brand_name_idx');
      await queryInterface.removeIndex('Cigars', 'cigar_popularity_idx');
      await queryInterface.removeIndex('Cigars', 'cigar_brand_date_idx');

      // Remove full-text search index
      if (queryInterface.sequelize.dialect.name === 'mysql') {
        await queryInterface.sequelize.query(`
          ALTER TABLE Cigars 
          DROP INDEX cigar_search_idx;
        `);
      }
      else if (queryInterface.sequelize.dialect.name === 'postgres') {
        await queryInterface.sequelize.query(`
          DROP INDEX cigar_search_idx;
        `);
      }
    } catch (error) {
      console.error('Error removing indexes:', error);
      throw error;
    }
  }
};