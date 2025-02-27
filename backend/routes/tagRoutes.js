// routes/tagRoutes.js
const express = require('express');
const router = express.Router();
const { Tag, Thread, User, sequelize } = require('../models');

// Get all tags with thread counts
router.get('/', async (req, res) => {
    try {
        const tags = await Tag.findAll({
            attributes: {
                include: [
                    [
                        sequelize.literal('(SELECT COUNT(*) FROM "ThreadTags" WHERE "ThreadTags"."tag_id" = "Tag"."id")'),
                        'threadCount'
                    ]
                ]
            },
            order: [['name', 'ASC']]
        });
        res.json(tags);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get threads by tag
router.get('/:tagName/threads', async (req, res) => {
    try {
        const tag = await Tag.findOne({
            where: { name: req.params.tagName.toLowerCase() },
            include: [
                {
                    model: Thread,
                    as: 'threads',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username']
                        },
                        {
                            model: Tag,
                            as: 'tags',
                            attributes: ['id', 'name'],
                            through: { attributes: [] }
                        }
                    ],
                    attributes: {
                        include: [
                            [
                                sequelize.literal('(SELECT COUNT(*) FROM "Replies" WHERE "Replies"."thread_id" = "threads"."id")'),
                                'replyCount'
                            ]
                        ]
                    }
                }
            ]
        });

        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.json(tag.threads);
    } catch (error) {
        console.error('Error fetching threads by tag:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;