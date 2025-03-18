// routes/replyRoutes.js
const express = require('express');
const router = express.Router();
const { Reply, User, Thread, Vote, Follow, Notification } = require('../models');
const sequelize = require('../config');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const replyValidation = [
    body('content').notEmpty().withMessage('Reply content is required')
];

// Create a reply (now supports nested replies and includes automatic upvote and reputation)
router.post('/threads/:threadId/replies', auth, replyValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { content, parentId } = req.body;
    const { threadId } = req.params;
    const transaction = await sequelize.transaction();

    try {
        const thread = await Thread.findByPk(threadId, {
            attributes: ['id', 'user_id'],
            transaction
        });

        if (!thread) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Thread not found' });
        }

        // If parentId is provided, verify it exists and belongs to the same thread
        let parentReply = null;
        if (parentId) {
            parentReply = await Reply.findOne({
                where: {
                    id: parentId,
                    thread_id: threadId
                },
                attributes: ['id', 'user_id', 'has_children'],
                transaction
            });
            
            if (!parentReply) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Parent reply not found' });
            }

            // Update parent's has_children flag if it's not already set
            if (!parentReply.has_children) {
                await parentReply.update({ has_children: true }, { transaction });
            }
        }

        // Create reply with initial vote count of 1
        const reply = await Reply.create({
            content,
            thread_id: threadId,
            user_id: req.user.userId,
            parent_id: parentId || null,
            is_deleted: false,
            has_children: false,
            vote_count: 1
        }, { transaction });

        // Create the initial upvote for the creator using upsert with explicit error handling
        try {
            await Vote.upsert({
                user_id: req.user.userId,
                voteable_id: reply.id,
                voteable_type: 'reply',
                vote_type: 'like'
            }, { 
                transaction,
                conflictFields: ['user_id', 'voteable_id', 'voteable_type']
            });
        } catch (error) {
            // If it's a unique constraint error, we can just continue
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.log('Ignoring duplicate vote - continuing with transaction');
            } else {
                // For other errors, we should still abort
                throw error;
            }
        }

        // Add reputation for the automatic upvote
        await User.increment('reputation', {
            by: 1,
            where: { id: req.user.userId },
            transaction
        });

        // Increment the thread's reply count
        await Thread.increment('reply_count', {
            where: { id: threadId },
            transaction
        });

        // Create notification array to hold all needed notifications
        const notifications = [];

        // Notify thread creator if it's not their own reply
        if (thread.user_id !== req.user.userId) {
            notifications.push({
                user_id: thread.user_id,
                type: 'reply',
                actor_id: req.user.userId,
                reference_id: reply.id,
                read: false
            });
        }

        // If it's a nested reply, notify parent reply creator
        if (parentReply && parentReply.user_id !== req.user.userId && parentReply.user_id !== thread.user_id) {
            notifications.push({
                user_id: parentReply.user_id,
                type: 'reply',
                actor_id: req.user.userId,
                reference_id: reply.id,
                read: false
            });
        }

        // Create all notifications
        await Promise.all(notifications.map(notification => 
            Notification.create(notification, { transaction })
        ));

        await transaction.commit();

        const completeReply = await Reply.findByPk(reply.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'reputation']
                }
            ]
        });

        res.status(201).json({
            ...completeReply.toJSON(),
            likes: 1,
            dislikes: 0,
            vote_count: 1,
            userVote: 'like'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating reply:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get replies for a thread (now includes nested structure)
router.get('/threads/:threadId/replies', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const replies = await Reply.findAll({
            where: {
                thread_id: req.params.threadId,
                parent_id: null // Get only top-level replies
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'reputation']
                },
                {
                    model: Vote,
                    as: 'votes',
                    required: false,
                    where: {
                        voteable_type: 'reply'
                    }
                },
                {
                    model: Reply,
                    as: 'children',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username']
                        },
                        {
                            model: Vote,
                            as: 'votes',
                            required: false,
                            where: {
                                voteable_type: 'reply'
                            }
                        },
                        {
                            model: Reply,
                            as: 'children',
                            include: [
                                {
                                    model: User,
                                    as: 'user',
                                    attributes: ['id', 'username']
                                },
                                {
                                    model: Vote,
                                    as: 'votes',
                                    required: false,
                                    where: {
                                        voteable_type: 'reply'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [
                ['vote_count', 'DESC'],
                ['created_at', 'DESC'],
                [{ model: Reply, as: 'children' }, 'created_at', 'ASC'],
                [{ model: Reply, as: 'children' }, { model: Reply, as: 'children' }, 'created_at', 'ASC']
            ]
        });

        // Process replies and their nested children to include vote information
        const processReply = (reply) => {
            const replyJson = reply.toJSON();
            const replyVotes = replyJson.votes || [];

            const processed = {
                ...replyJson,
                likes: replyVotes.filter(vote => vote.vote_type === 'like').length,
                dislikes: replyVotes.filter(vote => vote.vote_type === 'dislike').length,
                userVote: userId ? replyVotes.find(vote => vote.user_id === userId)?.vote_type || null : null,
                votes: undefined
            };

            if (processed.children) {
                processed.children = processed.children.map(child => processReply(child));
            }

            return processed;
        };

        const processedReplies = replies.map(reply => processReply(reply));

        res.json(processedReplies);
    } catch (error) {
        console.error('Error fetching replies:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a reply
router.put('/replies/:id', auth, replyValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const reply = await Reply.findByPk(req.params.id);
        
        if (!reply) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Reply not found' });
        }

        if (reply.user_id !== req.user.userId) {
            await transaction.rollback();
            return res.status(403).json({ error: 'Not authorized to update this reply' });
        }

        if (reply.is_deleted) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Cannot update a deleted reply' });
        }

        await reply.update({ content }, { transaction });
        await transaction.commit();

        const updatedReply = await Reply.findByPk(reply.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'reputation']
                },
                {
                    model: Vote,
                    as: 'votes',
                    required: false,
                    where: {
                        voteable_type: 'reply'
                    }
                }
            ]
        });

        const replyJson = updatedReply.toJSON();
        const votes = replyJson.votes || [];

        res.json({
            ...replyJson,
            likes: votes.filter(vote => vote.vote_type === 'like').length,
            dislikes: votes.filter(vote => vote.vote_type === 'dislike').length,
            userVote: votes.find(vote => vote.user_id === req.user.userId)?.vote_type || null,
            votes: undefined
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating reply:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a reply (implements soft delete)
router.delete('/replies/:id', auth, async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const reply = await Reply.findOne({
            where: { id: req.params.id },
            include: [{
                model: Reply,
                as: 'children'
            }]
        });
        
        if (!reply) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Reply not found' });
        }

        if (reply.user_id !== req.user.userId) {
            await transaction.rollback();
            return res.status(403).json({ error: 'Not authorized to delete this reply' });
        }

        const hasChildren = reply.children && reply.children.length > 0;

        if (hasChildren || reply.has_children) {
            // Soft delete if there are children - don't update reply count
            await reply.update({
                is_deleted: true
            }, { transaction });
        } else {
            // Hard delete if no children - decrement reply count
            await Thread.decrement('reply_count', {
                where: { id: reply.thread_id },
                transaction
            });
            await reply.destroy({ transaction });
        }

        await transaction.commit();
        
        if (hasChildren || reply.has_children) {
            const updatedReply = await Reply.findByPk(reply.id, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'reputation']
                    },
                    {
                        model: Vote,
                        as: 'votes',
                        required: false,
                        where: {
                            voteable_type: 'reply'
                        }
                    }
                ]
            });

            const replyJson = updatedReply.toJSON();
            const votes = replyJson.votes || [];

            res.json({
                ...replyJson,
                likes: votes.filter(vote => vote.vote_type === 'like').length,
                dislikes: votes.filter(vote => vote.vote_type === 'dislike').length,
                userVote: votes.find(vote => vote.user_id === req.user.userId)?.vote_type || null,
                votes: undefined
            });
        } else {
            res.json({ message: 'Reply deleted successfully' });
        }
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting reply:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;