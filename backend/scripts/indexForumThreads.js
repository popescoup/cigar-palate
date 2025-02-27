// backend/scripts/indexForumThreads.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { MeiliSearch } = require('meilisearch');
const { Thread, User, Tag, Vote } = require('../models');
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

// Function to unescape the key
function unescapeKey(key) {
    if (!key) return key;
    console.log('Escape characters found:', (key.match(/\\/g) || []).length);
    const unescaped = key.replace(/\\([\\$*&@])/g, '$1');
    console.log('Characters unescaped:', key.length - unescaped.length);
    return unescaped;
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

async function indexForumContent(transaction = null, meiliClient = null) {
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
        console.log('Starting forum content indexing...');
        
        if (shouldManageTransaction) {
            localTransaction = await sequelize.transaction();
        }
        
        // Reset indices if not part of bulk reindex
        if (!transaction) {
            await resetIndex(client, 'forum_threads', 'id');
            await resetIndex(client, 'forum_tags', 'id');
        }
        
        // Index threads
        const threads = await Thread.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['id', 'name']
                },
                {
                    model: Vote,
                    as: 'votes',
                    attributes: ['vote_type', 'user_id'],
                    where: {
                        voteable_type: 'thread'
                    },
                    required: false
                }
            ],
            attributes: {
                include: [
                    [
                        sequelize.literal('(SELECT COUNT(*) FROM "Replies" WHERE "Replies"."thread_id" = "Thread"."id")'),
                        'replyCount'
                    ]
                ]
            },
            transaction: localTransaction
        });

        console.log(`Found ${threads.length} threads to index`);

        const threadDocuments = threads.map(thread => {
            const threadJson = thread.toJSON();
            const votes = threadJson.votes || [];

            return {
                id: thread.id,
                title: thread.title,
                content: thread.content,
                author: threadJson.user ? threadJson.user.username : 'Anonymous',
                author_id: thread.user_id,
                tags: threadJson.tags ? threadJson.tags.map(tag => tag.name) : [],
                tag_ids: threadJson.tags ? threadJson.tags.map(tag => tag.id) : [],
                created_at: thread.created_at,
                updated_at: thread.updated_at,
                vote_count: thread.vote_count,
                likes: votes.filter(vote => vote.vote_type === 'like').length,
                dislikes: votes.filter(vote => vote.vote_type === 'dislike').length,
                resultType: 'forum',
                replyCount: parseInt(thread.getDataValue('replyCount')) || 0
            };
        });

        // Index tags
        const tags = await Tag.findAll({
            attributes: {
                include: [
                    [
                        sequelize.literal('(SELECT COUNT(*) FROM "ThreadTags" WHERE "ThreadTags"."tag_id" = "Tag"."id")'),
                        'threadCount'
                    ]
                ]
            },
            transaction: localTransaction
        });

        console.log(`Found ${tags.length} tags to index`);

        const tagDocuments = tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            threadCount: parseInt(tag.getDataValue('threadCount'))
        }));

        // Configure indices
        const threadIndex = client.index('forum_threads');
        const tagIndex = client.index('forum_tags');

        try {
            console.log('Updating thread index settings...');
            await threadIndex.updateSettings({
                searchableAttributes: [
                    'title',
                    'content',
                    'author',
                    'tags'
                ],
                filterableAttributes: [
                    'tags',
                    'tag_ids',
                    'author_id',
                    'vote_count',
                    'created_at',
                    'updated_at'
                ],
                sortableAttributes: [
                    'created_at',
                    'vote_count',
                    'replyCount'
                ],
                rankingRules: [
                    'sort',
                    'words',
                    'typo',
                    'proximity',
                    'attribute',
                    'exactness'
                ],
                pagination: {
                    maxTotalHits: 100
                }
            });

            await tagIndex.updateSettings({
                searchableAttributes: ['name'],
                filterableAttributes: ['threadCount'],
                sortableAttributes: ['threadCount']
            });

            console.log('Index settings updated successfully');

            // Verify settings
            const threadSettings = await threadIndex.getSettings();
            const tagSettings = await tagIndex.getSettings();
            console.log('Thread index settings:', JSON.stringify(threadSettings, null, 2));
            console.log('Tag index settings:', JSON.stringify(tagSettings, null, 2));
        } catch (error) {
            console.error('Error updating index settings:', error);
            throw error;
        }

        // Add documents to indices with error handling
        try {
            console.log('Adding thread documents...');
            const threadAddResponse = await threadIndex.addDocuments(threadDocuments);
            console.log('Adding tag documents...');
            const tagAddResponse = await tagIndex.addDocuments(tagDocuments);

            // Wait for tasks to complete and verify
            const [threadTask, tagTask] = await Promise.all([
                client.waitForTask(threadAddResponse.taskUid),
                client.waitForTask(tagAddResponse.taskUid)
            ]);

            console.log('Thread indexing task status:', threadTask);
            console.log('Tag indexing task status:', tagTask);

            if (threadTask.status === 'succeeded' && tagTask.status === 'succeeded') {
                console.log('Successfully indexed all forum content');
            }
        } catch (error) {
            console.error('Error adding documents:', error);
            throw error;
        }

        if (shouldManageTransaction) {
            await localTransaction.commit();
        }
        
        console.log('Forum content indexing completed successfully');
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

async function checkIndexStats(client) {
    try {
        // Check forum threads index
        const threadIndex = client.index('forum_threads');
        const threadStats = await threadIndex.getStats();
        console.log('\nForum Threads Index Stats:', {
            numberOfDocuments: threadStats.numberOfDocuments,
            isIndexed: threadStats.isIndexed
        });

        // Check tags index
        const tagIndex = client.index('forum_tags');
        const tagStats = await tagIndex.getStats();
        console.log('Forum Tags Index Stats:', {
            numberOfDocuments: tagStats.numberOfDocuments,
            isIndexed: tagStats.isIndexed
        });

        // List all available indexes
        const indexList = await client.getIndexes();
        console.log('Available Indexes:', Array.from(indexList).map(index => ({
            name: index.uid,
            primaryKey: index.primaryKey
        })));
    } catch (error) {
        console.error('Error checking index stats:', error);
    }
}

// Export for use in reindex.js
module.exports = { indexForumContent };

// Execute the indexing if run directly
if (require.main === module) {
    indexForumContent()
        .then(async () => {
            const client = new MeiliSearch({
                host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
                apiKey: process.env.MEILISEARCH_ADMIN_KEY?.trim()
            });
            console.log('\nChecking final index status...');
            await checkIndexStats(client);
            console.log('Indexing script completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Indexing script failed:', error);
            process.exit(1);
        });
}