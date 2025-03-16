// routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const sequelize = require('../config');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');
const emailService = require('../services/email');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { authLimiter, verificationLimiter, resendVerificationLimiter } = require('../middleware/rateLimiter');
const { AppError } = require('../middleware/errorHandler');
const { cleanupTokens } = require('../jobs/tokenCleanup');
const { 
  Thread, 
  Reply, 
  Review, 
  User, 
  Cigar, 
  Brand, 
  Bookmark,
  ThreadBookmark
} = require('../models');

const router = express.Router();

// Token and cookie duration constants
const TOKEN_EXPIRY_REMEMBER = '30d';  // 30 days for remember me
const TOKEN_EXPIRY_NORMAL = '24h';    // 24 hours for normal login
const COOKIE_MAX_AGE_REMEMBER = 30 * 24 * 3600000;  // 30 days in milliseconds
const COOKIE_MAX_AGE_NORMAL = 24 * 3600000;         // 24 hours in milliseconds


const sendEmailWithRetry = async (options, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await emailService.sendEmail(options);
      return;
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw new AppError('Failed to send email after multiple attempts', 500);
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
};


// Validate Username Route
router.post('/validate-username', async (req, res) => {
  const { username } = req.body;
  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }
    res.status(200).json({ message: 'Username is available' });
  } catch (error) {
    res.status(500).json({ message: 'Error checking username' });
  }
});

// Validate Email Route
router.post('/validate-email', async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }
    res.status(200).json({ message: 'Email is available' });
  } catch (error) {
    res.status(500).json({ message: 'Error checking email' });
  }
});

// Registration Route
router.post(
  '/register',
  [
    body('username')
      .notEmpty().withMessage('Username is required')
      .custom(async (value) => {
        const existingUser = await User.findOne({ where: { username: value } });
        if (existingUser) {
          throw new Error('Username is already in use');
        }
        return true;
      }),

    body('email')
      .isEmail().withMessage('Valid email is required')
      .custom(async (value) => {
        const existingUser = await User.findOne({ where: { email: value } });
        if (existingUser) {
          throw new Error('Email is already in use');
        }
        return true;
      }),

    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one symbol'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, acceptEmails } = req.body;
    console.log('Registration request received for:', email);
    
    const transaction = await sequelize.transaction();
    let transactionCommitted = false;

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create(
        {
          username,
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          acceptsEmails: acceptEmails || false,
          isVerified: false
        },
        { transaction }
      );
      console.log('User created with ID:', user.id);

      // Pass the transaction to generateVerificationToken
      console.log('Generating verification token with transaction...');
      const verificationToken = await user.generateVerificationToken(transaction);
      console.log('Token generation complete, preparing to commit transaction...');

      // FIRST commit the transaction, THEN send the email
      await transaction.commit();
      transactionCommitted = true;
      console.log('Transaction committed successfully');

      // Check if token is in database after commit
      const savedUser = await User.findOne({ where: { email } });
      console.log('User verification token after commit (first 8 chars):', 
        savedUser.verificationToken ? savedUser.verificationToken.substring(0, 8) + '...' : 'NULL');
      
      // Log frontend URL being used
      console.log('FRONTEND_URL being used for links:', process.env.FRONTEND_URL);
      
      // Then construct the verification link and send the email
      const baseUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
      const verificationLink = `${baseUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;
      console.log('Verification link (redacted):', verificationLink.replace(verificationToken, '[TOKEN]'));

      // Use new email retry mechanism
      await sendEmailWithRetry({
        to: email,
        subject: 'Verify Your Email Address',
        html: emailService.getVerificationEmailTemplate(verificationLink, username)
      });
      console.log('Verification email sent successfully');

      res.status(200).json({
        status: 'success',
        message: 'Registration successful! Please check your email to verify your account.',
        requiresVerification: true
      });
    } catch (err) {
      console.error('Registration error:', err);
      if (!transactionCommitted) {
        await transaction.rollback();
        console.log('Transaction rolled back');
      }
      next(new AppError(err.message || 'Registration failed', 400));
    }
  }
);

// Email Verification Route
router.post('/verify-email',
  verificationLimiter,
  async (req, res, next) => {
    try {
      console.log('=== Verification request received ===');
      console.log('Request body:', req.body);
      
      const { token } = req.body;
      if (!token) {
        console.log('Token is missing or undefined');
        throw new AppError('Verification token is required', 400);
      }

      console.log('Token from request:', token.substring(0, 8) + '...');
      
      // Try to find a recently verified user first (handled repeat verification)
      const recentlyVerifiedUser = await User.findOne({
        where: {
          isVerified: true,
          updatedAt: {
            [Op.gt]: new Date(Date.now() - 3600000) // Last hour
          }
        },
        order: [['updatedAt', 'DESC']]  // Get the most recently verified
      });
      
      if (recentlyVerifiedUser) {
        console.log('Found recently verified user:', recentlyVerifiedUser.id);
        
        // Generate authentication token
        const payload = { 
          userId: recentlyVerifiedUser.id,
          username: recentlyVerifiedUser.username
        };

        const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: TOKEN_EXPIRY_NORMAL
        });

        // Set cookie with proper settings based on environment
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https';
        
        // Determine proper cookie domain
        let cookieDomain;
        if (isProduction) {
          // Extract domain from request or use configured domain
          const host = req.get('x-forwarded-host') || req.get('host');
          if (host && host.includes('cigarpalate.com')) {
            cookieDomain = '.cigarpalate.com'; // Works for www.cigarpalate.com and cigarpalate.com
          }
        }
        
        console.log('Setting cookie with options:', {
          httpOnly: true,
          secure: secureFlag,
          sameSite: 'Lax',
          maxAge: COOKIE_MAX_AGE_NORMAL,
          domain: cookieDomain || undefined
        });
        
        res.cookie('token', authToken, {
          httpOnly: true,
          secure: secureFlag,
          sameSite: 'Lax',
          maxAge: COOKIE_MAX_AGE_NORMAL,
          domain: cookieDomain || undefined
        });
        
        return res.json({
          status: 'success',
          message: 'Your account is already verified! You are now logged in.',
          verified: true,
          alreadyVerified: true
        });
      }

      // Proceed with normal token verification if no recently verified user found
      // Try both raw and decoded tokens if they differ
      let tokens = [token];
      try {
        const decodedToken = decodeURIComponent(token);
        if (decodedToken !== token) {
          console.log('Token appears to be URL-encoded, also trying decoded version');
          tokens.push(decodedToken);
        }
      } catch (e) {
        console.log('Error decoding token:', e);
      }

      // Try each token variant
      let user = null;
      
      for (const tokenToTry of tokens) {
        console.log('Trying token (first 8 chars):', tokenToTry.substring(0, 8) + '...');
        
        const hashedToken = crypto
          .createHash('sha256')
          .update(tokenToTry)
          .digest('hex');
        
        console.log('Hashed token (first 8 chars):', hashedToken.substring(0, 8) + '...');
        
        // Check for user with this token
        user = await User.findOne({
          where: {
            verificationToken: hashedToken,
            verificationExpiry: {
              [Op.gt]: new Date()
            },
            isVerified: false
          }
        });
        
        console.log('User found with this token?', !!user);
        
        if (user) {
          console.log('Found valid user with ID:', user.id);
          break;
        }
      }

      // If no user found with any token variant
      if (!user) {
        // Check for any unverified users that might match
        const allUnverifiedUsers = await User.findAll({ 
          where: { isVerified: false },
          attributes: ['id', 'email', 'verificationToken', 'verificationExpiry']
        });
        
        console.log('All unverified users:', allUnverifiedUsers.length);
        
        throw new AppError('Invalid or expired verification token', 400);
      }

      // Store the original verification token (for debugging/auditing)
      const originalToken = user.verificationToken;
      
      // Update user to verified state
      console.log('Updating user to verified state');
      user.isVerified = true;
      user.verificationToken = null;
      user.verificationExpiry = null;
      await user.save();
      console.log('User successfully verified');

      // Generate authentication token
      const payload = { 
        userId: user.id,
        username: user.username
      };

      const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY_NORMAL
      });

      // Set cookie with proper settings based on environment
      const isProduction = process.env.NODE_ENV === 'production';
      const secureFlag = isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https';
      
      // Determine proper cookie domain
      let cookieDomain;
      if (isProduction) {
        // Extract domain from request or use configured domain
        const host = req.get('x-forwarded-host') || req.get('host');
        if (host && host.includes('cigarpalate.com')) {
          cookieDomain = '.cigarpalate.com'; // Works for www.cigarpalate.com and cigarpalate.com
        }
      }
      
      console.log('Setting cookie with options:', {
        httpOnly: true,
        secure: secureFlag,
        sameSite: 'Lax',
        maxAge: COOKIE_MAX_AGE_NORMAL,
        domain: cookieDomain || undefined
      });
      
      res.cookie('token', authToken, {
        httpOnly: true,
        secure: secureFlag,
        sameSite: 'Lax',
        maxAge: COOKIE_MAX_AGE_NORMAL,
        domain: cookieDomain || undefined
      });
      
      console.log('Authentication cookie set');

      res.json({
        status: 'success',
        message: 'Email verified successfully! You are now logged in.',
        verified: true
      });
    } catch (err) {
      console.error('Verification error:', err);
      next(err);
    }
  }
);

// Resend Verification Email Route
router.post('/resend-verification',
  resendVerificationLimiter,
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('=== Resend verification request received ===');
      const { email } = req.body;
      console.log('Email:', email);
      
      const user = await User.findOne({ 
        where: { 
          email,
          isVerified: false
        } 
      });
      console.log('Unverified user found?', !!user);

      if (user) {
        // Generate new token
        console.log('Generating new verification token for user ID:', user.id);
        const verificationToken = await user.generateVerificationToken();

        // Construct the full verification URL
        const baseUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
        const verificationLink = `${baseUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;
        console.log('New verification link (redacted):', verificationLink.replace(verificationToken, '[TOKEN]'));

        // Send email with the full link
        await sendEmailWithRetry({
          to: email,
          subject: 'Verify Your Email Address',
          html: emailService.getVerificationEmailTemplate(verificationLink, user.username)
        });
        console.log('Resend verification email sent successfully');
      }

      res.json({
        message: 'If an unverified account exists with this email, a new verification link will be sent.'
      });
    } catch (err) {
      console.error('Resend verification error:', err);
      next(new AppError('Failed to resend verification email', 500));
    }
  }
);

// Login Route
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, rememberMe } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new AppError('Invalid credentials', 400);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AppError('Invalid credentials', 400);
      }

      if (!user.isVerified) {
        return res.status(401).json({
          status: 'error',
          message: 'Please verify your email address before logging in',
          requiresVerification: true,
          email: user.email
        });
      }

      const payload = { 
        userId: user.id,
        username: user.username
      };

      const tokenExpiry = rememberMe ? TOKEN_EXPIRY_REMEMBER : TOKEN_EXPIRY_NORMAL;
      const cookieMaxAge = rememberMe ? COOKIE_MAX_AGE_REMEMBER : COOKIE_MAX_AGE_NORMAL;

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: tokenExpiry });

      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // Since we're using HTTP in development
        sameSite: 'Lax',
        maxAge: cookieMaxAge,
        domain: undefined // Let the browser handle the domain in development
      });

      res.status(200).json({
        status: 'success',
        message: 'Login successful'
      });
    } catch (err) {
      next(err);
    }
  }
);

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// Auth Status Route
router.get('/status', async (req, res) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.json({ 
      isLoggedIn: false,
      user: null
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.json({ 
        isLoggedIn: false,
        user: null
      });
    }

    res.json({ 
      isLoggedIn: true, 
      user: {
        userId: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.json({ 
      isLoggedIn: false,
      user: null 
    });
  }
});

// Profile Route
router.get('/profile', async (req, res) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'username', 'email', 'reputation', 'acceptsEmails', 'bio'],
      include: [
        {
          model: User,
          as: 'followers',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'following',
          attributes: ['id'],
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      reputation: user.reputation,
      acceptsEmails: user.acceptsEmails,
      bio: user.bio,
      followers: user.followers,
      following: user.following
    });
  } catch (err) {
    console.error('Error in profile route:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Overview Route for authenticated user profile
router.get('/profile/overview', auth, async (req, res) => {
  try {
    const [
      threads,
      replies,
      reviews,
      totalThreads,
      totalReplies,
      totalReviews,
      totalBookmarks,
      totalThreadBookmarks
    ] = await Promise.all([
      // Get 5 most recent threads
      Thread.findAll({
        where: { user_id: req.user.userId },
        order: [['created_at', 'DESC']],
        limit: 5,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['username']
          }
        ]
      }),
      // Get 5 most recent replies
      Reply.findAll({
        where: { 
          user_id: req.user.userId,
          is_deleted: false 
        },
        order: [['created_at', 'DESC']],
        limit: 5,
        include: [
          {
            model: Thread,
            as: 'thread',
            attributes: ['title', 'id']
          },
          {
            model: User,
            as: 'user',
            attributes: ['username']
          }
        ]
      }),
      // Get 5 most recent reviews
      Review.findAll({
        where: { user_id: req.user.userId },
        order: [['created_at', 'DESC']],
        limit: 5,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['username']
          },
          {
            model: Cigar,
            as: 'cigar',
            attributes: ['name', 'id'],
            include: [{
              model: Brand,
              as: 'brand',
              attributes: ['name']
            }]
          }
        ]
      }),
      // Get total counts
      Thread.count({ where: { user_id: req.user.userId } }),
      Reply.count({ where: { user_id: req.user.userId, is_deleted: false } }),
      Review.count({ where: { user_id: req.user.userId } }),
      Bookmark.count({ where: { user_id: req.user.userId } }),
      ThreadBookmark.count({ where: { user_id: req.user.userId } })
    ]);

    // Combine and sort recent activity
    const recentActivity = [...threads, ...reviews, ...replies]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    res.json({
      recentActivity,
      stats: {
        totalThreads,
        totalReplies,
        totalReviews,
        totalBookmarks,
        totalThreadBookmarks
      }
    });
  } catch (err) {
    console.error('Error in profile overview route:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-specific routes
router.get('/admin/users', [auth, isAdmin], async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'isAdmin', 'created_at']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Forgot Password Route
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (user) {
        const resetToken = await user.generatePasswordResetToken();
        await emailService.sendPasswordResetEmail(email, resetToken);
      }

      // Always return success to prevent email enumeration
      res.json({
        message: 'If an account exists with this email, you will receive password reset instructions shortly.'
      });
    } catch (err) {
      console.error('Password reset request error:', err);
      res.status(500).json({ message: 'Error processing password reset request' });
    }
  }
);

// Reset Password Route
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one symbol'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { token, newPassword } = req.body;
      
      // Create hash of reset token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with matching token, using Op.gt correctly now
      const user = await User.findOne({
        where: {
          resetToken: hashedToken,
          resetTokenExpiry: {
            [Op.gt]: new Date()  // Changed from sequelize.Op.gt to Op.gt
          }
        }
      });

      if (!user) {
        return res.status(400).json({
          message: 'Password reset token is invalid or has expired'
        });
      }

      // Hash new password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();

      res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
      console.error('Password reset error:', err);
      res.status(500).json({ message: 'Error resetting password' });
    }
  }
);

// Email Preferences Route
router.patch('/update-email-preferences', auth, async (req, res) => {
  try {
    const { acceptsEmails } = req.body;
    
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.acceptsEmails = acceptsEmails;
    await user.save();

    res.json({ 
      message: 'Email preferences updated successfully',
      acceptsEmails: user.acceptsEmails 
    });
  } catch (err) {
    console.error('Error updating email preferences:', err);
    res.status(500).json({ message: 'Error updating email preferences' });
  }
});

// Change Password Route
router.patch('/change-password',
  auth,  // Ensure user is authenticated
  [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one symbol'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Hash and save new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      user.password = hashedPassword;
      await user.save();

      res.json({ 
        message: 'Password updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

// Bio Update Route
router.patch('/update-bio', auth, async (req, res, next) => {
  try {
    const { bio } = req.body;
    
    // Validate bio length
    if (bio && bio.length > 140) {
      throw new AppError('Bio cannot exceed 140 characters', 400);
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.bio = bio;
    await user.save();

    res.json({ 
      message: 'Bio updated successfully',
      bio: user.bio 
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;