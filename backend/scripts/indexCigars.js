// indexCigars.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { MeiliSearch } = require('meilisearch');
const { Cigar, Brand, Review } = require('../models');
const sequelize = require('../config');

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
        await client.createIndex(indexName, { primaryKey });
        console.log(`Created new ${indexName} index with primary key: ${primaryKey}`);
        // Return the index reference this way
        return client.index(indexName);
    } catch (error) {
        console.error(`Error resetting ${indexName} index:`, error);
        throw error;
    }
}

async function updateIndexSettings(index, settings) {
    console.log('Starting settings update...');
    try {
        // Apply settings
        const updateTask = await index.updateSettings(settings);
        console.log('Settings update task:', updateTask);

        // Wait for the task to complete
        if (updateTask?.taskUid) {
            const task = await index.waitForTask(updateTask.taskUid);
            console.log('Settings update task status:', task);
            
            if (task.status !== 'succeeded') {
                throw new Error(`Settings update failed: ${task.status}`);
            }
        }

        // Verify settings
        const currentSettings = await index.getSettings();
        console.log('Current settings after update:', currentSettings);

        // Verify specific settings
        if (!currentSettings.filterableAttributes?.includes('price_range')) {
            throw new Error('price_range not found in filterableAttributes after update');
        }

        return currentSettings;
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
}

async function indexCigars(transaction = null, meiliClient = null) {
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
        console.log('Starting cigar indexing...');
        
        if (shouldManageTransaction) {
            localTransaction = await sequelize.transaction();
        }
        
        // Reset/create the cigars index if not part of bulk reindex
        const index = !transaction ? 
            await resetIndex(client, 'cigars', 'id') : 
            await client.index('cigars');

        // Fetch cigars with review counts
        const cigars = await Cigar.findAll({
            include: [
                { model: Brand, as: 'brand' },
                { model: Review, as: 'reviews', attributes: [] }
            ],
            attributes: {
                include: [
                    [
                        sequelize.literal('(SELECT COUNT(*) FROM "Reviews" WHERE "Reviews"."cigar_id" = "Cigar"."id")'),
                        'reviewCount'
                    ]
                ]
            },
            transaction: localTransaction
        });

        console.log(`Found ${cigars.length} cigars to index`);

        // Transform the cigars data
        const documents = cigars.map(cigar => {
            const reviewCount = parseInt(cigar.getDataValue('reviewCount')) || 0;
            const ratingCount = cigar.numberOfRatings || 0;
            const popularityScore = reviewCount + ratingCount;

            // Base document
            const doc = {
                id: cigar.id,
                name: cigar.name,
                brand: cigar.brand ? cigar.brand.name : null,
                flavors: cigar.flavors,
                shape: cigar.shape,
                size: cigar.size,
                color: cigar.color,
                wrap_type: cigar.wrap_type,
                filler: cigar.filler,
                country_of_origin: cigar.country_of_origin,
                aging: cigar.aging,
                handmade: cigar.handmade,
                description: cigar.description,
                dimensions: cigar.dimensions,    // New field
                made_by: cigar.made_by,         // New field
                averageRating: cigar.averageRating,
                numberOfRatings: ratingCount,
                reviewCount: reviewCount,
                popularityScore: popularityScore,
                strength: cigar.strength,
                binder: cigar.binder,
                searchableCharacteristics: `${cigar.shape || ''} ${cigar.size || ''} ${cigar.color || ''} ${cigar.wrap_type || ''} ${cigar.filler || ''} ${cigar.binder || ''} ${cigar.strength || ''} ${cigar.dimensions || ''} ${cigar.made_by || ''}`.toLowerCase().trim(),
                resultType: 'cigar'
            };

            if (cigar.price_range) {
                doc.price_range = cigar.price_range;
                console.log(`Cigar ${cigar.name} has price range: ${cigar.price_range}`);
            }

            return doc;
        });

        // Before adding documents, update settings
        console.log('Updating index settings...');
        const settings = {
            searchableAttributes: [
                'name',
                'brand',
                'flavors',
                'description',
                'searchableCharacteristics',
                'country_of_origin',
                'dimensions',    // New field
                'made_by'       // New field
            ],
            filterableAttributes: [
                'price_range'
            ],
            sortableAttributes: [
                'averageRating',
                'popularityScore',
                'numberOfRatings',
                'reviewCount'
            ],
            rankingRules: [
                'sort',
                'words',
                'typo',
                'proximity',
                'attribute',
                'exactness'
            ]
        };

        await updateIndexSettings(index, settings);

        // Add documents to index with error handling
        try {
            console.log('Adding cigar documents...');
            const addResponse = await index.addDocuments(documents);
            console.log('Documents addition task created:', addResponse);

            // Wait for task completion
            const task = await client.waitForTask(addResponse.taskUid);
            console.log('Documents addition task completed:', task);

            if (task.status !== 'succeeded') {
                throw new Error(`Document indexing failed: ${task.status}`);
            }

            // Verify documents were added
            const stats = await index.getStats();
            console.log('Index stats after adding documents:', stats);

        } catch (error) {
            console.error('Error adding documents:', error);
            throw error;
        }

        if (shouldManageTransaction) {
            await localTransaction.commit();
        }
        
        console.log('Cigar indexing completed successfully');
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
module.exports = { indexCigars };

// Execute the indexing if run directly
if (require.main === module) {
    indexCigars()
        .then(() => {
            console.log('Indexing script completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Indexing script failed:', error);
            process.exit(1);
        });
}