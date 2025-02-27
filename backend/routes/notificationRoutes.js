// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { User, Notification, Thread, Reply, Review, Cigar, Brand } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get recent notifications for notification bell (limited to 15)
router.get('/recent', auth, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.userId },
            include: [
                {
                    model: User,
                    as: 'actor',
                    attributes: ['username']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 15
        });

        // Get unread count
        const unreadCount = await Notification.count({
            where: {
                user_id: req.user.userId,
                read: false
            }
        });

        // Format notifications with appropriate content
        const formattedNotifications = await Promise.all(notifications.map(async (notification) => {
            const baseNotification = {
                id: notification.id,
                type: notification.type,
                actor: notification.actor.username,
                created_at: notification.created_at,
                read: notification.read
            };

            // Add specific content based on notification type
            switch (notification.type) {
                case 'follow':
                    return {
                        ...baseNotification,
                        message: `${notification.actor.username} started following you`
                    };
                case 'thread':
                    const thread = await Thread.findByPk(notification.reference_id, {
                        attributes: ['id', 'title']
                    });
                    return {
                        ...baseNotification,
                        message: `${notification.actor.username} created a new thread: ${thread?.title}`,
                        thread_id: thread?.id
                    };
                case 'reply':
                    const reply = await Reply.findByPk(notification.reference_id, {
                        include: [{
                            model: Thread,
                            as: 'thread',
                            attributes: ['id', 'title']
                        }]
                    });
                    return {
                        ...baseNotification,
                        message: `${notification.actor.username} replied to: ${reply?.thread?.title}`,
                        thread_id: reply?.thread?.id,
                        reference_id: notification.reference_id 
                    };
                case 'review':
                    const review = await Review.findByPk(notification.reference_id, {
                        include: [{
                            model: Cigar,
                            as: 'cigar',
                            attributes: ['id', 'name'],
                            include: [{
                                model: Brand,
                                as: 'brand',
                                attributes: ['name']
                            }]
                        }]
                    });
                    return {
                        ...baseNotification,
                        message: `${notification.actor.username} reviewed: ${review?.cigar?.brand?.name} ${review?.cigar?.name}`,
                        cigar_id: review?.cigar?.id,
                        reference_id: notification.reference_id 
                    };
                case 'review_reply':
                    const reviewReply = await Review.findByPk(notification.reference_id, {
                        include: [
                            {
                                model: Review,
                                as: 'parent',
                                include: [{
                                    model: Cigar,
                                    as: 'cigar',
                                    attributes: ['id', 'name'],
                                    include: [{
                                        model: Brand,
                                        as: 'brand',
                                        attributes: ['name']
                                    }]
                                }]
                            }
                        ]
                    });
                    
                    // Get the cigar info from either the parent review or the reply itself
                    const cigar = reviewReply?.parent?.cigar || reviewReply?.cigar;
                    
                    return {
                        ...baseNotification,
                        message: `${notification.actor.username} replied to a review of: ${cigar?.brand?.name} ${cigar?.name}`,
                        cigar_id: cigar?.id,
                        reference_id: notification.reference_id
                    };
                default:
                    return baseNotification;
            }
        }));

        res.json({
            notifications: formattedNotifications,
            unread_count: unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all notifications with infinite scroll
router.get('/all', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const notifications = await Notification.findAll({
            where: { user_id: req.user.userId },
            include: [
                {
                    model: User,
                    as: 'actor',
                    attributes: ['username']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        // Format notifications similarly to the recent endpoint
        const formattedNotifications = await Promise.all(notifications.map(async (notification) => {
            // Same formatting logic as above
            const baseNotification = {
                id: notification.id,
                type: notification.type,
                actor: notification.actor.username,
                created_at: notification.created_at,
                read: notification.read
            };

            // Inside your switch statement for notification formatting
switch (notification.type) {
    case 'follow':
        return {
            ...baseNotification,
            message: `${notification.actor.username} started following you`
        };
    case 'thread':
        const thread = await Thread.findByPk(notification.reference_id, {
            attributes: ['id', 'title']
        });
        return {
            ...baseNotification,
            message: `${notification.actor.username} created a new thread: ${thread?.title}`,
            thread_id: thread?.id
        };
    case 'reply':
        const reply = await Reply.findByPk(notification.reference_id, {
            include: [{
                model: Thread,
                as: 'thread',
                attributes: ['id', 'title']
            }]
        });
        return {
            ...baseNotification,
            message: `${notification.actor.username} replied to: ${reply?.thread?.title}`,
            thread_id: reply?.thread?.id,
            reference_id: notification.reference_id 
        };
    case 'review':
        const review = await Review.findByPk(notification.reference_id, {
            include: [{
                model: Cigar,
                as: 'cigar',
                attributes: ['id', 'name'],
                include: [{
                    model: Brand,
                    as: 'brand',
                    attributes: ['name']
                }]
            }]
        });
        return {
            ...baseNotification,
            message: `${notification.actor.username} reviewed: ${review?.cigar?.brand?.name} ${review?.cigar?.name}`,
            cigar_id: review?.cigar?.id,
            reference_id: notification.reference_id 
        };
    case 'review_reply':
        const reviewReply = await Review.findByPk(notification.reference_id, {
            include: [
                {
                    model: Review,
                    as: 'parent',
                    include: [{
                        model: Cigar,
                        as: 'cigar',
                        attributes: ['id', 'name'],
                        include: [{
                            model: Brand,
                            as: 'brand',
                            attributes: ['name']
                        }]
                    }]
                }
            ]
        });
        
        // Get the cigar info from either the parent review or the reply itself
        const cigar = reviewReply?.parent?.cigar || reviewReply?.cigar;
        
        return {
            ...baseNotification,
            message: `${notification.actor.username} replied to a review of: ${cigar?.brand?.name} ${cigar?.name}`,
            cigar_id: cigar?.id,
            reference_id: notification.reference_id
        };
    default:
        return baseNotification;
}
        }));

        // Get total count for pagination
        const totalCount = await Notification.count({
            where: { user_id: req.user.userId }
        });

        res.json({
            notifications: formattedNotifications,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            hasMore: offset + notifications.length < totalCount
        });
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark a notification as read
router.patch('/:notificationId/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: {
                id: req.params.notificationId,
                user_id: req.user.userId
            }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.update({ read: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark all notifications as read
router.post('/mark-all-read', auth, async (req, res) => {
    try {
        await Notification.update(
            { read: true },
            {
                where: {
                    user_id: req.user.userId,
                    read: false
                }
            }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Clear all notifications
router.delete('/clear-all', auth, async (req, res) => {
    try {
        await Notification.destroy({
            where: { user_id: req.user.userId }
        });
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;