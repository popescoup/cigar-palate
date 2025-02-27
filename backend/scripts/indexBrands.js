// indexBrands.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { MeiliSearch } = require('meilisearch');
const { Brand, Cigar } = require('../models');
const sequelize = require('../config');
const { literal } = require('sequelize');

// Enhanced debug logging
console.log('Debug Information:');
console.log('Environment variables loaded from:', path.resolve(__dirname, '../.env'));
console.log('MEILISEARCH_HOST:', process.env.MEILISEARCH_HOST);

// Function to safely display a key for debugging
function debugKey(key) {
    if (!key) return 'not set';
    return `${key.substring(0, 3)}...${key.substring(key.length - 3)} (length: ${key.length})`;
}

// Test connection function with more detail
async function testMeiliConnection(client) {
    try {
        const health = await client.health();
        console.log('MeiliSearch health check:', health);
        const version = await client.getVersion();
        console.log('MeiliSearch version:', version);
        return true;
    } catch (error) {
        console.error('MeiliSearch connection test failed:', error.message);
        if (error.message.includes('invalid')) {
            console.log('Key being used:', debugKey(client.config.apiKey));
        }
        return false;
    }
}

// Add reset index function
async function resetIndex(client, indexName, primaryKey = 'id') {
    try {
        // Delete existing index if it exists
        try {
            await client.deleteIndex(indexName);
            console.log(`Existing ${indexName} index deleted`);
        } catch (error) {
            if (error.code !== 'index_not_found') {
                throw error;
            }
            console.log(`No existing ${indexName} index to delete`);
        }

        // Create new index with primary key
        await client.createIndex(indexName, {
            primaryKey: primaryKey
        });
        console.log(`Created new ${indexName} index with primary key: ${primaryKey}`);
    } catch (error) {
        console.error(`Error resetting ${indexName} index:`, error);
        throw error;
    }
}

async function indexBrands(transaction = null, meiliClient = null) {
    // Initialize MeiliSearch client if not provided
    const client = meiliClient || new MeiliSearch({
        host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
        apiKey: process.env.MEILISEARCH_ADMIN_KEY?.trim()
    });

    // Test connection before proceeding
    const connectionTest = await testMeiliConnection(client);
    if (!connectionTest) {
        throw new Error('Failed to connect to MeiliSearch');
    }

    // Handle transaction management
    const shouldManageTransaction = !transaction;
    let localTransaction = transaction;
    
    try {
        console.log('Starting brand indexing...');
        
        if (shouldManageTransaction) {
            localTransaction = await sequelize.transaction();
        }
        
        // Reset/create the brands index if not part of bulk reindex
        if (!transaction) {
            await resetIndex(client, 'brands', 'id');
        }
        
        // Fetch brands with their cigars and calculated metrics
        const brands = await Brand.findAll({
            include: [{
                model: Cigar,
                as: 'cigars',
                attributes: ['averageRating']
            }],
            attributes: [
                'id',
                'name',
                'created_at',
                'updated_at',
                [
                    literal('(SELECT COUNT(*) FROM "Cigars" WHERE "Cigars"."brand_id" = "Brand"."id")'),
                    'cigarCount'
                ]
            ],
            transaction: localTransaction
        });

        console.log(`Found ${brands.length} brands to index`);

        // Transform the brands data
        const documents = brands.map(brand => {
            const brandJson = brand.toJSON();
            const cigars = brandJson.cigars || [];
            
            // Calculate average rating across all cigars
            const totalRatings = cigars.reduce((sum, cigar) => sum + (cigar.averageRating || 0), 0);
            const averageRating = cigars.length > 0 ? totalRatings / cigars.length : 0;
            
            // Get cigar count
            const catalogueSize = parseInt(brand.getDataValue('cigarCount')) || 0;

            // Log calculations for verification
            console.log(`Metrics for ${brand.name}:`, {
                cigarCount: catalogueSize,
                averageRating: averageRating.toFixed(2)
            });
            
            return {
                id: brand.id,
                name: brand.name,
                created_at: brand.created_at,
                updated_at: brand.updated_at,
                cigarCount: catalogueSize,
                averageRating: parseFloat(averageRating.toFixed(2)),
            };
        });

        // Log sample documents sorted by different metrics
        const byRating = [...documents].sort((a, b) => b.averageRating - a.averageRating).slice(0, 5);
        const byCatalogue = [...documents].sort((a, b) => b.cigarCount - a.cigarCount).slice(0, 5);

        console.log('\nTop 5 brands by average rating:', 
            byRating.map(brand => ({
                name: brand.name,
                averageRating: brand.averageRating
            }))
        );

        console.log('\nTop 5 brands by catalogue size:', 
            byCatalogue.map(brand => ({
                name: brand.name,
                cigarCount: brand.cigarCount
            }))
        );

        const index = client.index('brands');

        try {
            console.log('Updating brand index settings...');
            await index.updateSettings({
                searchableAttributes: [
                    'name'
                ],
                filterableAttributes: [
                    'cigarCount',
                    'averageRating'
                ],
                sortableAttributes: [
                    'averageRating',
                    'cigarCount',
                    'created_at'
                ],
                rankingRules: [
                    'sort',
                    'words',
                    'typo',
                    'proximity',
                    'attribute',
                    'exactness'
                ]
            });
            console.log('Brand index settings updated successfully');

            // Verify settings were applied
            const settings = await index.getSettings();
            console.log('Current index settings:', JSON.stringify(settings, null, 2));
        } catch (error) {
            console.error('Error updating brand index settings:', error);
            throw error;
        }

        // Add documents to index with error handling
        try {
            console.log('Adding brand documents...');
            const addResponse = await index.addDocuments(documents);
            console.log('Brands indexed successfully:', addResponse);

            // Wait for task completion and verify
            const task = await client.waitForTask(addResponse.taskUid);
            console.log('Indexing task status:', task);

            if (task.status === 'succeeded') {
                console.log('Successfully indexed all brands with metrics');
            }
        } catch (error) {
            console.error('Error adding brand documents:', error);
            throw error;
        }

        if (shouldManageTransaction) {
            await localTransaction.commit();
        }
        
        console.log('Brand indexing completed successfully');
    } catch (error) {
        if (shouldManageTransaction && localTransaction) {
            await localTransaction.rollback();
        }
        console.error('Error during indexing:', error);
        throw error;
    } finally {
        if (shouldManageTransaction) {
            await sequelize.close();
        }
    }
}

// Export for use in reindex.js
module.exports = { indexBrands };

// Execute the indexing if run directly
if (require.main === module) {
    indexBrands()
        .then(() => {
            console.log('Indexing script completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Indexing script failed:', error);
            process.exit(1);
        });
}