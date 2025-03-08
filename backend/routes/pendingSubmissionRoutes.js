// routes/pendingSubmissionRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');
const PendingSubmission = require('../models/pendingSubmission');
const Brand = require('../models/brand');
const User = require('../models/user');
const sequelize = require('../config');
const emailService = require('../services/email');
const spacesUploadMiddleware = require('../middleware/spacesUploadMiddleware');
const { deleteImage } = require('../utils/spaces-config');

// Submit new pending submission
router.post('/pending-submissions', [auth, spacesUploadMiddleware], async (req, res) => {
    // Add detailed logging of incoming request
    console.log('Received form data:', {
        fullBody: req.body,
        price_range: req.body.price_range,
        strength: req.body.strength,
        binder: req.body.binder
    });

    console.log('Submission Route - User object:', req.user);
    console.log('File upload details:', {
        files: req.files,
        cigarImage: req.files['image']?.[0],
        brandImage: req.files['brand_image']?.[0]
    });

    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                error: 'Authentication required',
                details: 'No user ID found'
            });
        }

        // Validate required fields
        if (!req.processedImages?.cigar) {
            return res.status(400).json({
                error: 'Missing cigar image',
                details: 'Cigar image is required'
            });
        }

        if (!req.body.name?.trim()) {
            return res.status(400).json({
                error: 'Missing cigar name',
                details: 'Cigar name is required'
            });
        }

        if (!req.body.flavors?.trim()) {
            return res.status(400).json({
                error: 'Missing flavors',
                details: 'At least one flavor is required'
            });
        }

        if (!req.body.description?.trim()) {
            return res.status(400).json({
                error: 'Missing description',
                details: 'Description is required'
            });
        }

        // Brand validation
        if (!req.body.brand_id && !req.body.new_brand_name) {
            return res.status(400).json({
                error: 'Missing brand information',
                details: 'Either an existing brand or a new brand name is required'
            });
        }

        // Get image keys
        const cigarImageKey = req.processedImages?.cigar?.key;
        const brandImageKey = req.processedImages?.brand?.key;

        // Validate brand image if submitting new brand
        if (req.body.new_brand_name && !req.processedImages?.brand) {
            if (req.processedImages?.cigar) {
                await deleteImage(cigarImageKey);
            }
            return res.status(400).json({
                error: 'Missing brand image',
                details: 'Brand image is required when submitting a new brand'
            });
        }

        // Validate price_range if provided
        if (req.body.price_range) {
            const validPriceRanges = ['<$10', '$10.01 - $25', '$25.01 - $50', '$50.01 - $75', '$75.01 - $100', '$100.01<'];
            if (!validPriceRanges.includes(req.body.price_range)) {
                return res.status(400).json({ 
                    error: 'Invalid price range',
                    details: 'Price range must be one of the predefined values'
                });
            }
        }

        // Construct submission data
        const submissionData = {
            cigar_name: req.body.name,
            image_key: cigarImageKey,
            brand_id: req.body.brand_id || null,
            new_brand_name: req.body.new_brand_name || null,
            new_brand_description: req.body.new_brand_description,
            new_brand_image_key: brandImageKey,
            flavors: req.body.flavors,
            description: req.body.description,
            submitter_id: req.user.userId,
        };

        // Add optional characteristics
        if (req.body.shape) submissionData.shape = req.body.shape;
        if (req.body.size) submissionData.size = req.body.size;
        if (req.body.color) submissionData.color = req.body.color;
        if (req.body.wrap_type) submissionData.wrap_type = req.body.wrap_type;
        if (req.body.filler) submissionData.filler = req.body.filler;
        if (req.body.country_of_origin) submissionData.country_of_origin = req.body.country_of_origin;
        if (req.body.aging) submissionData.aging = parseInt(req.body.aging, 10);
        if (req.body.dimensions) submissionData.dimensions = req.body.dimensions;
        if (req.body.made_by) submissionData.made_by = req.body.made_by;
        if (req.body.handmade === 'true' || req.body.handmade === 'false') {
            submissionData.handmade = req.body.handmade === 'true';
        }

        // Add new fields
        if (req.body.price_range) submissionData.price_range = req.body.price_range;
        if (req.body.strength) submissionData.strength = req.body.strength;
        if (req.body.binder) submissionData.binder = req.body.binder;

        console.log('Creating submission with data:', submissionData);

        const submission = await PendingSubmission.create(submissionData);

        console.log('Submission created successfully:', {
            id: submission.id,
            cigarKey: submission.image_key,
            brandKey: submission.new_brand_image_key,
            price_range: submission.price_range,
            strength: submission.strength,
            binder: submission.binder
        });

        res.status(201).json({
            message: 'Submission received and pending approval',
            submission
        });
    } catch (err) {
        // Clean up processed images if submission fails
        if (req.processedImages?.cigar) {
            try {
                await deleteImage(req.processedImages.cigar.key);
                console.log('Cleaned up processed cigar image after failed submission');
            } catch (deleteErr) {
                console.error('Error deleting processed cigar image:', deleteErr);
            }
        }
        if (req.processedImages?.brand) {
            try {
                await deleteImage(req.processedImages.brand.key);
                console.log('Cleaned up processed brand image after failed submission');
            } catch (deleteErr) {
                console.error('Error deleting processed brand image:', deleteErr);
            }
        }

        console.error('Error creating submission:', {
            error: err,
            message: err.message,
            stack: err.stack,
            submissionData: req.body
        });
        res.status(400).json({ error: 'Failed to create submission', details: err.message });
    }
});

// Get all pending submissions (admin only)
router.get('/pending-submissions', [auth, isAdmin], async (req, res) => {
    try {
        const submissions = await PendingSubmission.findAll({
            include: [
                {
                    model: User,
                    as: 'submitter',
                    attributes: ['username']
                },
                {
                    model: Brand,
                    as: 'brand',
                    attributes: ['name']
                }
            ],
            order: [['submission_date', 'DESC']]
        });

        res.json(submissions);
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Get user's submissions
router.get('/pending-submissions/my-submissions', auth, async (req, res) => {
    try {
        const submissions = await PendingSubmission.findAll({
            where: { submitter_id: req.user.userId },
            order: [['submission_date', 'DESC']]
        });

        res.json(submissions);
    } catch (err) {
        console.error('Error fetching user submissions:', err);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Get single submission details
router.get('/pending-submissions/:id', [auth], async (req, res) => {
    try {
        const submission = await PendingSubmission.findOne({
            where: {
                id: req.params.id,
                [sequelize.Op.or]: [
                    { submitter_id: req.user.userId },
                    sequelize.literal('true') // Allow admin to view all (protected by isAdmin middleware)
                ]
            },
            include: [
                {
                    model: User,
                    as: 'submitter',
                    attributes: ['username']
                },
                {
                    model: Brand,
                    as: 'brand',
                    attributes: ['name']
                }
            ]
        });

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(submission);
    } catch (err) {
        console.error('Error fetching submission:', err);
        res.status(500).json({ error: 'Failed to fetch submission details' });
    }
});

// Update submission
router.put('/pending-submissions/:id', [auth, isAdmin, spacesUploadMiddleware], async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const submission = await PendingSubmission.findByPk(req.params.id);

        console.log('Update request body:', {
            brand_id: req.body.brand_id,
            new_brand_name: req.body.new_brand_name,
            fullBody: req.body
        });
        
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Validate required fields
        if (!req.body.name?.trim() && !req.body.cigar_name?.trim()) {
            return res.status(400).json({ 
                error: 'Missing cigar name',
                details: 'Cigar name is required'
            });
        }

        if (!req.body.flavors?.trim()) {
            return res.status(400).json({ 
                error: 'Missing flavors',
                details: 'At least one flavor is required'
            });
        }

        if (!req.body.description?.trim()) {
            return res.status(400).json({ 
                error: 'Missing description',
                details: 'Description is required'
            });
        }

        // Store old image keys in case we need to delete them
        const oldImageKey = submission.image_key;
        const oldBrandImageKey = submission.new_brand_image_key;

        // Get new image keys
        let newCigarKey = null;
        let newBrandKey = null;

        if (req.processedImages?.cigar) {
            newCigarKey = req.processedImages.cigar.key;
        }

        if (req.processedImages?.brand) {
            newBrandKey = req.processedImages.brand.key;
        }

        // Validate brand image if submitting new brand
        if (req.body.new_brand_name && !req.processedImages?.brand && !submission.new_brand_image_key) {
            return res.status(400).json({
                error: 'Missing brand image',
                details: 'Brand image is required when submitting a new brand'
            });
        }

        // Prepare update data with required fields
        const updateData = {
            cigar_name: req.body.cigar_name || req.body.name,
            brand_id: req.body.brand_id || submission.brand_id,
            new_brand_name: req.body.new_brand_name ? req.body.new_brand_name : null,
            new_brand_description: req.body.new_brand_description,
            flavors: req.body.flavors,
            description: req.body.description
        };

        // Update image keys if new files were uploaded
        if (newCigarKey) {
            updateData.image_key = newCigarKey;
        }
        if (newBrandKey) {
            updateData.new_brand_image_key = newBrandKey;
        }

        // Add optional fields only if they have values
        if (req.body.shape) updateData.shape = req.body.shape;
        if (req.body.size) updateData.size = req.body.size;
        if (req.body.color) updateData.color = req.body.color;
        if (req.body.wrap_type) updateData.wrap_type = req.body.wrap_type;
        if (req.body.filler) updateData.filler = req.body.filler;
        if (req.body.country_of_origin) updateData.country_of_origin = req.body.country_of_origin;
        if (req.body.aging) updateData.aging = parseInt(req.body.aging, 10);
        if (req.body.dimensions) updateData.dimensions = req.body.dimensions;
        if (req.body.made_by) updateData.made_by = req.body.made_by;
        if (req.body.handmade === 'true' || req.body.handmade === 'false') {
            updateData.handmade = req.body.handmade === 'true';
        }

        // Add new fields
        if (req.body.price_range) {
            const validPriceRanges = ['<$10', '$10.01 - $25', '$25.01 - $50', '$50.01 - $75', '$75.01 - $100', '$100.01<'];
            if (validPriceRanges.includes(req.body.price_range)) {
                updateData.price_range = req.body.price_range;
            } else {
                return res.status(400).json({ error: 'Invalid price range' });
            }
        }
        if (req.body.strength) updateData.strength = req.body.strength;
        if (req.body.binder) updateData.binder = req.body.binder;

        console.log('Updating submission with data:', {
            id: submission.id,
            oldCigarKey: oldImageKey,
            newCigarKey: updateData.image_key,
            oldBrandKey: oldBrandImageKey,
            newBrandKey: updateData.new_brand_image_key
        });

        await submission.update(updateData);

        // Delete old images if they were replaced
        if (newCigarKey && oldImageKey) {
            try {
                await deleteImage(oldImageKey);
                console.log('Deleted old cigar image:', oldImageKey);
            } catch (error) {
                console.error('Error deleting old cigar image:', error);
            }
        }

        if (newBrandKey && oldBrandImageKey) {
            try {
                await deleteImage(oldBrandImageKey);
                console.log('Deleted old brand image:', oldBrandImageKey);
            } catch (error) {
                console.error('Error deleting old brand image:', error);
            }
        }
        
        // Fetch updated submission with associations
        const updatedSubmission = await PendingSubmission.findByPk(submission.id, {
            include: [
                {
                    model: User,
                    as: 'submitter',
                    attributes: ['username']
                },
                {
                    model: Brand,
                    as: 'brand',
                    attributes: ['name']
                }
            ]
        });

        console.log('Successfully updated submission:', {
            id: updatedSubmission.id,
            cigarKey: updatedSubmission.image_key,
            brandKey: updatedSubmission.new_brand_image_key
        });
        
        res.json(updatedSubmission);
    } catch (err) {
        await transaction.rollback();
        
        // Clean up any newly processed images if update fails
        if (req.processedImages?.cigar) {
            try {
                await deleteImage(req.processedImages.cigar.key);
                console.log('Cleaned up new processed cigar image after failed update');
            } catch (deleteErr) {
                console.error('Error deleting new processed cigar image:', deleteErr);
            }
        }
        if (req.processedImages?.brand) {
            try {
                await deleteImage(req.processedImages.brand.key);
                console.log('Cleaned up new processed brand image after failed update');
            } catch (deleteErr) {
                console.error('Error deleting new processed brand image:', deleteErr);
            }
        }
    
        console.error('Error updating submission:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Bulk approve submissions
router.post('/pending-submissions/bulk/approve', [auth, isAdmin], async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { ids } = req.body;

        if (!ids?.length) {
            return res.status(400).json({
                error: 'Invalid request',
                details: 'Array of IDs required'
            });
        }

        const submissions = await PendingSubmission.findAll({
            where: { id: ids },
            include: [{
                model: User,
                as: 'submitter',
                attributes: ['username', 'email']
            }],
            transaction: t
        });

        const approved = [];
        for (const submission of submissions) {
            try {
                const approvedCigar = await submission.approve(req.user.userId, t);
                approved.push(approvedCigar);

                // Send approval email with cigar ID
                if (submission.submitter?.email) {
                    try {
                        await emailService.sendEmail({
                            to: submission.submitter.email,
                            subject: 'Your Cigar Submission Has Been Approved! 🎉',
                            html: emailService.getApprovalEmailTemplate(submission.cigar_name, approvedCigar.id)
                        });
                    } catch (emailError) {
                        console.error('Failed to send approval email:', emailError);
                        // Continue with other submissions
                    }
                }
            } catch (approvalError) {
                console.error(`Error approving submission ${submission.id}:`, approvalError);
                // Continue with other submissions
            }
        }

        await t.commit();
        res.json({
            message: `Successfully approved ${approved.length} submissions`,
            approved,
            totalProcessed: submissions.length
        });
    } catch (err) {
        await t.rollback();
        console.error('Error in bulk approve:', err);
        res.status(500).json({ error: 'Failed to approve submissions' });
    }
});

// Bulk decline submissions
router.post('/pending-submissions/bulk/decline', [auth, isAdmin], async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { ids, notes } = req.body;

        if (!ids?.length || !notes) {
            return res.status(400).json({
                error: 'Invalid request',
                details: 'Array of IDs and notes required'
            });
        }

        const submissions = await PendingSubmission.findAll({
            where: { id: ids },
            include: [{
                model: User,
                as: 'submitter',
                attributes: ['username', 'email']
            }],
            transaction: t
        });

        const declined = [];
        for (const submission of submissions) {
            try {
                await submission.decline(req.user.userId, notes, t);
                declined.push(submission.id);
                
                // Send decline email
                if (submission.submitter?.email) {
                    try {
                        await emailService.sendEmail({
                            to: submission.submitter.email,
                            subject: 'Update on Your Cigar Submission',
                            html: emailService.getDeclineEmailTemplate(submission.cigar_name, notes)
                        });
                    } catch (emailError) {
                        console.error('Failed to send decline email:', emailError);
                        // Continue with other submissions
                    }
                }
            } catch (declineError) {
                console.error(`Error declining submission ${submission.id}:`, declineError);
                // Continue with other submissions
            }
        }

        await t.commit();
        res.json({
            message: `Successfully declined ${declined.length} submissions`,
            declined,
            totalProcessed: submissions.length
        });
    } catch (err) {
        await t.rollback();
        console.error('Error in bulk decline:', err);
        res.status(500).json({ error: 'Failed to decline submissions' });
    }
});

// Approve single submission
router.post('/pending-submissions/:id/approve', [auth, isAdmin], async (req, res) => {
    try {
        const submission = await PendingSubmission.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'submitter',
                attributes: ['username', 'email']
            }]
        });
        
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        console.log('Starting approval process for submission:', submission.id);
        console.log('Original image keys:', {
            cigar: submission.image_key,
            brand: submission.new_brand_image_key
        });

        const approvedCigar = await submission.approve(req.user.userId);
        
        console.log('Approval complete, approved cigar:', {
            id: approvedCigar.id,
            image_key: approvedCigar.image_key
        });

        // Send approval email with cigar ID
        if (submission.submitter?.email) {
            try {
                await emailService.sendEmail({
                    to: submission.submitter.email,
                    subject: 'Your Cigar Submission Has Been Approved! 🎉',
                    html: emailService.getApprovalEmailTemplate(submission.cigar_name, approvedCigar.id)
                });
            } catch (emailError) {
                console.error('Failed to send approval email:', emailError);
            }
        }
        
        res.json({
            message: 'Submission approved successfully',
            cigar: approvedCigar
        });
    } catch (err) {
        console.error('Error approving submission:', err);
        res.status(500).json({ error: 'Failed to approve submission' });
    }
});

// Decline single submission
router.post('/pending-submissions/:id/decline', [auth, isAdmin], async (req, res) => {
    try {
        const { notes } = req.body;
        if (!notes) {
            return res.status(400).json({ error: 'Decline notes are required' });
        }

        const submission = await PendingSubmission.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'submitter',
                attributes: ['username', 'email']
            }]
        });
        
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        await submission.decline(req.user.userId, notes);
        
        // Send decline email
        if (submission.submitter?.email) {
            try {
                await emailService.sendEmail({
                    to: submission.submitter.email,
                    subject: 'Update on Your Cigar Submission',
                    html: emailService.getDeclineEmailTemplate(submission.cigar_name, notes)
                });
            } catch (emailError) {
                console.error('Failed to send decline email:', emailError);
            }
        }
        
        res.json({ 
            message: 'Submission declined successfully',
            declinedSubmissionId: submission.id
        });
    } catch (err) {
        console.error('Error declining submission:', err);
        res.status(500).json({ error: 'Failed to decline submission' });
    }
});

// Test upload route
router.post('/test-upload', spacesUploadMiddleware, (req, res) => {
    console.log('Test upload received:', {
        files: req.files,
        body: req.body
    });
    res.json({
        message: 'Upload test complete',
        files: req.files
    });
});

// Error handling middleware for multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                details: 'Maximum file size is 3.5MB'
            });
        }
        return res.status(400).json({
            error: 'File upload error',
            details: err.message
        });
    } else if (err) {
        // An unknown error occurred when uploading.
        return res.status(500).json({
            error: 'Server error',
            details: 'An unexpected error occurred while processing your request'
        });
    }
    next();
});

module.exports = router;