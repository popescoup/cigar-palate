const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { MeiliSearch } = require('meilisearch');
const sequelize = require('../config');
const { indexBrands } = require('./indexBrands');
const { indexCigars } = require('./indexCigars');
const { indexForumContent } = require('./indexForumThreads');

// Standardized settings for all indices
const STANDARD_SETTINGS = {
    rankingRules: [
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness"
    ],
    typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
            oneTypo: 5,
            twoTypos: 9
        },
        disableOnWords: [],
        disableOnAttributes: []
    }
};

// Initialize MeiliSearch client
const client = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_ADMIN_KEY?.trim()
});

// Utility function to test MeiliSearch connection
async function testConnection() {
    try {
        const health = await client.health();
        console.log('MeiliSearch connection status:', health.status);
        const version = await client.getVersion();
        console.log('MeiliSearch version:', version);
        return true;
    } catch (error) {
        console.error('Failed to connect to MeiliSearch:', error);
        return false;
    }
}

// Verification function to ensure index exists
async function ensureIndexExists(client, indexName, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const index = await client.getIndex(indexName);
            if (index) return true;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`Retry ${i + 1}/${retries} for index ${indexName}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return false;
}

// Enhanced reset index function with verification and delay
async function resetIndex(indexName, primaryKey = 'id') {
    try {
        console.log(`Attempting to reset index: ${indexName}`);
        try {
            await client.deleteIndex(indexName);
            console.log(`Successfully deleted existing index: ${indexName}`);
        } catch (error) {
            if (error.code !== 'index_not_found') throw error;
            console.log(`No existing index found for: ${indexName}`);
        }

        // Create new index
        await client.createIndex(indexName, { primaryKey });
        
        // Add delay to ensure index is ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Apply standard settings to new index
        const index = client.index(indexName);
        await index.updateSettings({
            ...STANDARD_SETTINGS,
            // Add any index-specific settings here
            searchableAttributes: getSearchableAttributes(indexName),
            filterableAttributes: getFilterableAttributes(indexName),
            sortableAttributes: getSortableAttributes(indexName)
        });
        
        // Verify index creation and settings
        await ensureIndexExists(client, indexName);
        const settings = await index.getSettings();
        console.log(`Index ${indexName} settings:`, JSON.stringify(settings, null, 2));
        
        console.log(`Successfully reset and verified index: ${indexName}`);
    } catch (error) {
        console.error(`Error resetting index ${indexName}:`, error);
        throw error;
    }
}

// Helper functions for index-specific attributes
function getSearchableAttributes(indexName) {
    switch (indexName) {
        case 'cigars':
            return [
                'name',
                'brand',
                'flavors',
                'description',
                'searchableCharacteristics',
                'country_of_origin',
                'dimensions',
                'made_by'
            ];
        case 'brands':
            return ['name'];
        case 'forum_threads':
            return ['title', 'content', 'author', 'tags'];
        case 'forum_tags':
            return ['name'];
        default:
            return ['*'];
    }
}

function getFilterableAttributes(indexName) {
    switch (indexName) {
        case 'cigars':
            return ['price_range'];
        case 'brands':
            return ['averageRating', 'cigarCount'];
        case 'forum_threads':
            return ['author_id', 'created_at', 'tag_ids', 'tags', 'updated_at', 'vote_count'];
        case 'forum_tags':
            return ['threadCount'];
        default:
            return [];
    }
}

function getSortableAttributes(indexName) {
    switch (indexName) {
        case 'cigars':
            return ['averageRating', 'numberOfRatings', 'popularityScore', 'reviewCount'];
        case 'brands':
            return ['averageRating', 'cigarCount', 'created_at'];
        case 'forum_threads':
            return ['created_at', 'replyCount', 'vote_count'];
        case 'forum_tags':
            return ['threadCount'];
        default:
            return [];
    }
}

// Function to validate index settings
async function validateIndexSettings() {
    console.log('\nValidating index settings...');
    
    try {
        const indices = {
            cigars: client.index('cigars'),
            brands: client.index('brands'),
            forum_threads: client.index('forum_threads'),
            forum_tags: client.index('forum_tags')
        };

        // Get settings and stats for all indices
        const settings = {};
        const stats = {};

        for (const [name, index] of Object.entries(indices)) {
            settings[name] = await index.getSettings();
            stats[name] = await index.getStats();

            // Verify ranking rules match standard settings
            const rankingRulesMatch = JSON.stringify(settings[name].rankingRules) === 
                JSON.stringify(STANDARD_SETTINGS.rankingRules);
            
            console.log(`\n${name} Index Validation:`);
            console.log('Settings:', JSON.stringify(settings[name], null, 2));
            console.log('Stats:', {
                numberOfDocuments: stats[name].numberOfDocuments,
                isIndexed: stats[name].isIndexed
            });
            console.log('Ranking Rules Match:', rankingRulesMatch);
        }

        return true;
    } catch (error) {
        console.error('Error validating index settings:', error);
        throw error;
    }
}

// Enhanced reindexing function with sequential processing
async function reindexAll() {
    if (!(await testConnection())) {
        throw new Error('Failed to connect to MeiliSearch');
    }

    const transaction = await sequelize.transaction();
    
    try {
        console.log('Starting full reindex...');
        
        // Reset all indices sequentially to ensure proper creation
        const indices = ['brands', 'cigars', 'forum_threads', 'forum_tags'];
        for (const index of indices) {
            await resetIndex(index);
            console.log(`Index ${index} reset complete`);
        }

        // Sequential indexing operations
        console.log('Starting brand indexing...');
        await indexBrands(transaction, client);
        console.log('Brand indexing complete');

        console.log('Starting cigar indexing...');
        await indexCigars(transaction, client);
        console.log('Cigar indexing complete');

        console.log('Starting forum content indexing...');
        await indexForumContent(transaction, client);
        console.log('Forum content indexing complete');

        await transaction.commit();
        
        // Validate settings after indexing
        await validateIndexSettings();
        
        console.log('Full reindex completed successfully');
    } catch (error) {
        await transaction.rollback();
        console.error('Reindex failed:', error);
        throw error;
    } finally {
    }
}

// Execute reindexing if script is run directly
if (require.main === module) {
    reindexAll()
        .then(() => {
            console.log('Reindexing completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Reindexing failed:', error);
            process.exit(1);
        });
}

module.exports = { reindexAll };