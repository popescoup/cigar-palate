// jobs/notificationReminder.js
const { Op } = require('sequelize');
const sequelize = require('../config');
const { User, Notification, Thread, Reply, Review, Cigar, Brand } = require('../models');
const emailService = require('../services/email');
const schedule = require('node-schedule');

// Reminder intervals in days
const REMINDER_INTERVALS = [3, 7, 14, 21, 45];

async function checkAndSendReminders() {
    try {
        // Get all users with unread notifications
        const usersWithUnreadNotifications = await User.findAll({
            attributes: [
                'id', 
                'username', 
                'email', 
                'metadata',
                [sequelize.fn('COUNT', sequelize.col('notifications.id')), 'notificationCount']
            ],
            include: [{
                model: Notification,
                as: 'notifications',
                where: {
                    read: false,
                    created_at: {
                        [Op.lte]: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)) // 3 days ago
                    }
                },
                required: true,
                attributes: []
            }],
            having: sequelize.literal('COUNT(notifications.id) >= 3'),
            group: ['User.id', 'User.username', 'User.email', 'User.metadata']
        });

        for (const user of usersWithUnreadNotifications) {
            // Get user's last reminder date from their metadata
            const lastReminderDate = user.metadata?.lastNotificationReminder 
                ? new Date(user.metadata.lastNotificationReminder)
                : null;
            
            // Calculate days since last reminder
            const daysSinceLastReminder = lastReminderDate
                ? Math.floor((Date.now() - lastReminderDate.getTime()) / (24 * 60 * 60 * 1000))
                : Infinity;

            // Determine if we should send a reminder based on intervals
            let shouldSendReminder = false;
            let nextInterval = 3; // Default first interval

            if (!lastReminderDate) {
                shouldSendReminder = true;
            } else {
                // Find the next appropriate interval
                for (const interval of REMINDER_INTERVALS) {
                    if (daysSinceLastReminder >= interval) {
                        nextInterval = interval;
                        shouldSendReminder = true;
                    } else {
                        break;
                    }
                }

                // For intervals after 45 days
                if (daysSinceLastReminder >= 45) {
                    shouldSendReminder = (daysSinceLastReminder % 45) === 0;
                    nextInterval = 45;
                }
            }

            if (shouldSendReminder) {
                // Get the 3 most recent unread notifications
                const recentNotifications = await Notification.findAll({
                    where: {
                        user_id: user.id,
                        read: false
                    },
                    order: [['created_at', 'DESC']],
                    limit: 3,
                    include: [
                        {
                            model: User,
                            as: 'actor',
                            attributes: ['username']
                        }
                    ]
                });

                // Format notifications with custom loading based on type
                const formattedNotifications = await Promise.all(
                    recentNotifications.map(async (notification) => {
                        switch (notification.type) {
                            case 'follow':
                                return {
                                    type: 'follow',
                                    message: `${notification.actor.username} started following you`,
                                    actor: notification.actor.username,
                                    created_at: notification.created_at
                                };
                                
                            case 'thread':
                                const thread = await Thread.findByPk(notification.reference_id, {
                                    attributes: ['title']
                                });
                                return {
                                    type: 'thread',
                                    message: `${notification.actor.username} created a new thread: ${thread?.title}`,
                                    thread_id: notification.reference_id,
                                    created_at: notification.created_at
                                };
                                
                                case 'reply':
                                    const reply = await Reply.findByPk(notification.reference_id, {
                                        include: [{
                                            model: Thread,
                                            as: 'thread',
                                            attributes: ['title', 'id']  // Explicitly include id
                                        }]
                                    });
                                    
                                    if (!reply) {
                                        console.error(`Reply not found for notification ${notification.id}`);
                                        return null;
                                    }
                                    
                                    if (!reply.thread) {
                                        console.error(`Thread not found for reply ${notification.reference_id}`);
                                        return null;
                                    }
                                    
                                    return {
                                        type: 'reply',
                                        message: `${notification.actor.username} replied to: ${reply.thread.title}`,
                                        thread_id: reply.thread.id,  // No optional chaining since we validated above
                                        reference_id: notification.reference_id,
                                        created_at: notification.created_at,
                                        // Add additional context for debugging
                                        debug_info: {
                                            reply_id: reply.id,
                                            thread_id: reply.thread.id,
                                            notification_id: notification.id
                                        }
                                    };
                                
                            case 'review':
                                const review = await Review.findByPk(notification.reference_id, {
                                    include: [{
                                        model: Cigar,
                                        as: 'cigar',
                                        include: [{
                                            model: Brand,
                                            as: 'brand',
                                            attributes: ['name']
                                        }]
                                    }]
                                });
                                return {
                                    type: 'review',
                                    message: `${notification.actor.username} reviewed: ${review?.cigar?.brand?.name} ${review?.cigar?.name}`,
                                    cigar_id: review?.cigar?.id,
                                    reference_id: notification.reference_id,
                                    created_at: notification.created_at
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
                                                include: [{
                                                    model: Brand,
                                                    as: 'brand',
                                                    attributes: ['name']
                                                }]
                                            }]
                                        },
                                        {
                                            model: Cigar,
                                            as: 'cigar',
                                            include: [{
                                                model: Brand,
                                                as: 'brand',
                                                attributes: ['name']
                                            }]
                                        }
                                    ]
                                });
                                const cigar = reviewReply?.parent?.cigar || reviewReply?.cigar;
                                return {
                                    type: 'review_reply',
                                    message: `${notification.actor.username} replied to a review of: ${cigar?.brand?.name} ${cigar?.name}`,
                                    cigar_id: cigar?.id,
                                    reference_id: notification.reference_id,
                                    created_at: notification.created_at
                                };
                                
                            default:
                                return {
                                    type: 'default',
                                    message: `${notification.actor.username} interacted with your content`,
                                    created_at: notification.created_at
                                };
                        }
                    })
                );

                // Send reminder email
                await emailService.sendNotificationReminderEmail(
                    user,
                    formattedNotifications
                );

                // Update user's last reminder date
                await user.update({
                    metadata: {
                        ...user.metadata,
                        lastNotificationReminder: new Date()
                    }
                });

                console.log(`Sent notification reminder email to user ${user.username} (${user.email})`);
            }
        }
    } catch (error) {
        console.error('Error in notification reminder job:', error);
    }
}

function scheduleNotificationReminders() {
    // Run the job every minute (for testing)
    const job = schedule.scheduleJob('0 0 * * *', checkAndSendReminders);
    console.log('Notification reminder job scheduled');
    return job;
}

module.exports = {
    scheduleNotificationReminders,
    checkAndSendReminders // Exported for testing purposes
};