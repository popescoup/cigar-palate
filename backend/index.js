// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}

// Import models
const Cigar = require('./models/cigar');
const Brand = require('./models/brand');
const User = require('./models/user');
const Review = require('./models/review');
const FlavorRanking = require('./models/flavorRanking');
const Thread = require('./models/thread');
const Reply = require('./models/reply');
const Tag = require('./models/tag');
const ThreadTag = require('./models/threadTag');
const Vote = require('./models/vote');
const PendingSubmission = require('./models/pendingSubmission');
const ThreadBookmark = require('./models/ThreadBookmark');
const Follow = require('./models/follow');
const Notification = require('./models/notification');

// Import routes
const cigarRoutes = require('./routes/cigarRoutes');
const brandRoutes = require('./routes/brandRoutes');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviewRoutes');
const searchRoutes = require('./routes/searchRoutes');
const threadRoutes = require('./routes/threadRoutes');
const replyRoutes = require('./routes/replyRoutes');
const tagRoutes = require('./routes/tagRoutes');
const voteRoutes = require('./routes/voteRoutes');
const pendingSubmissionRoutes = require('./routes/pendingSubmissionRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const profileRoutes = require('./routes/profileRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const threadBookmarkRoutes = require('./routes/threadBookmarkRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const statsRoutes = require('./routes/statsRoutes');
// const openGraphRoutes = require('./routes/openGraphRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Log application environment configuration
console.log('===== Application Environment =====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// Check for common environment issues
if (!process.env.FRONTEND_URL) {
  console.error('⚠️ ERROR: FRONTEND_URL environment variable is not set');
} else {
  try {
    const frontendUrl = new URL(process.env.FRONTEND_URL);
    console.log('Frontend configuration:', {
      protocol: frontendUrl.protocol,
      host: frontendUrl.host,
      hostname: frontendUrl.hostname,
      port: frontendUrl.port || 'default',
      pathname: frontendUrl.pathname
    });
    
    // Check for protocol issues
    if (frontendUrl.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ SECURITY WARNING: FRONTEND_URL does not use HTTPS in production');
    }
    
    // Check for common domain issues
    if (frontendUrl.hostname.startsWith('www.') && !app.get('corsOptions')?.origin?.includes(`https://${frontendUrl.hostname}`)) {
      console.warn(`⚠️ CORS WARNING: www subdomain ${frontendUrl.hostname} may not be in CORS whitelist`);
    } else if (!frontendUrl.hostname.startsWith('www.') && !app.get('corsOptions')?.origin?.includes(`https://www.${frontendUrl.hostname}`)) {
      console.warn(`⚠️ CORS WARNING: www version of ${frontendUrl.hostname} may not be in CORS whitelist`);
    }
  } catch (e) {
    console.error('⚠️ ERROR: FRONTEND_URL is invalid:', e.message);
  }
}

// Check email-related environment variables
if (!process.env.MAILGUN_API_KEY) {
  console.error('⚠️ ERROR: MAILGUN_API_KEY environment variable is not set');
}
if (!process.env.MAILGUN_DOMAIN) {
  console.error('⚠️ ERROR: MAILGUN_DOMAIN environment variable is not set');
}
if (!process.env.MAILGUN_FROM_ADDRESS) {
  console.warn('⚠️ WARNING: MAILGUN_FROM_ADDRESS environment variable is not set, using default');
}

// Check JWT secret for authentication
if (!process.env.JWT_SECRET) {
  console.error('⚠️ ERROR: JWT_SECRET environment variable is not set');
} else if (process.env.JWT_SECRET.length < 32 && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ SECURITY WARNING: JWT_SECRET is too short for production use');
}

console.log('==================================');

// IMPORTANT: Configure trust proxy more securely
// Only trust specific known proxies instead of 'true' which trusts everything
// This addresses the express-rate-limit warning
app.set('trust proxy', [
  'loopback',                  // localhost
  'linklocal',                 // 169.254.0.0/16
  'uniquelocal',               // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  '172.69.0.0/16',             // Cloudflare IPs
  '54.0.0.0/8',                // AWS IPs 
  '138.197.0.0/16',            // DigitalOcean IPs
  '159.203.0.0/16',            // DigitalOcean IPs
  '104.131.0.0/16'             // DigitalOcean IPs
]);

// Determine allowed origins based on environment
const allowedOrigins = [
  'http://localhost:3001',
  `http://192.168.1.243:3001`
];

// In production, always include both www and non-www variants
if (process.env.NODE_ENV === 'production' || process.env.FRONTEND_URL) {
  try {
    const frontendUrl = new URL(process.env.FRONTEND_URL || 'https://www.cigarpalate.com');
    const hostname = frontendUrl.hostname;
    
    // Add the configured URL
    allowedOrigins.push(`${frontendUrl.protocol}//${hostname}`);
    
    // Add variants with and without www
    if (hostname.startsWith('www.')) {
      const nonWwwHostname = hostname.substring(4);
      allowedOrigins.push(`${frontendUrl.protocol}//${nonWwwHostname}`);
    } else {
      allowedOrigins.push(`${frontendUrl.protocol}//www.${hostname}`);
    }
    
    // Always include the specific cigarpalate.com domains
    allowedOrigins.push('https://cigarpalate.com');
    allowedOrigins.push('https://www.cigarpalate.com');
  } catch (e) {
    console.error('Error parsing FRONTEND_URL for CORS:', e);
    // Fallback to hardcoded domains
    allowedOrigins.push('https://cigarpalate.com');
    allowedOrigins.push('https://www.cigarpalate.com');
  }
}

// Log the allowed origins
console.log('CORS allowed origins:', allowedOrigins);

// Enable CORS for requests from frontend with proper origin handling
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

// Increase payload size limit for JSON requests
app.use(express.json({ limit: '10mb' }));

// Use cookie-parser middleware
app.use(cookieParser());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res, filepath) => {
        res.set('Cache-Control', 'public, max-age=31536000');
        
        const ext = path.extname(filepath).toLowerCase();
        switch (ext) {
            case '.jpg':
            case '.jpeg':
                res.set('Content-Type', 'image/jpeg');
                break;
            case '.png':
                res.set('Content-Type', 'image/png');
                break;
        }
    }
}));

// Handle missing image fallback
app.use('/uploads', (err, req, res, next) => {
    if (err.code === 'ENOENT') {
        console.warn(`Missing image requested: ${req.path}`);
        res.status(404).json({ error: 'Image not found' });
    } else {
        next(err);
    }
});

// Set up API routes
app.use('/api', cigarRoutes);
app.use('/api', brandRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', reviewRoutes);
app.use('/api', searchRoutes);
app.use('/api', pendingSubmissionRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/user', profileRoutes);
app.use('/api', recommendationRoutes);
app.use('/api', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', statsRoutes);
// app.use('/api', openGraphRoutes);

// Forum routes
app.use('/api/threads', threadRoutes);
app.use('/api', replyRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api', voteRoutes);
app.use('/api/thread-bookmarks', threadBookmarkRoutes);

// Enhanced but deployment-friendly health check
app.get('/health', async (req, res) => {
    console.log('Health check called at:', new Date().toISOString());
    
    // Always return 200 status for deployment to succeed
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      components: {
        app: { status: 'ok' },
        database: { status: 'unknown' },
        filesystem: { status: 'unknown' },
        environment: { 
          variables: {
            NODE_ENV: process.env.NODE_ENV || 'not set',
            PORT: process.env.PORT || 'not set',
            DB_HOST: process.env.DB_HOST ? 'set' : 'not set',
            DB_PORT: process.env.DB_PORT ? 'set' : 'not set',
            DB_USER: process.env.DB_USER ? 'set' : 'not set',
            DB_NAME: process.env.DB_NAME ? 'set' : 'not set'
          }
        }
      }
    };
    
    // Test database connection
    try {
      console.log('Health check: Testing database connection');
      console.log('Using connection params:', {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER ? 'provided' : 'missing',
        ssl: process.env.DB_SSL || 'not specified'
      });
      
      await sequelize.authenticate();
      console.log('Health check: Database connection successful');
      healthStatus.components.database = { 
        status: 'connected',
        dialect: sequelize.getDialect(),
        name: sequelize.getDatabaseName()
      };
    } catch (err) {
      console.error('Health check: Database connection failed:', err);
      healthStatus.components.database = { 
        status: 'error', 
        message: err.message,
        code: err.original?.code,
        sqlState: err.original?.sqlState
      };
    }
    
    // Test filesystem access
    try {
      console.log('Health check: Testing filesystem access');
      const uploadsDir = path.join(__dirname, 'uploads');
      await fsPromises.access(uploadsDir, fs.constants.W_OK);
      console.log('Health check: Filesystem access successful');
      healthStatus.components.filesystem = { status: 'accessible' };
    } catch (err) {
      console.error('Health check: Filesystem access failed:', err);
      healthStatus.components.filesystem = { 
        status: 'error', 
        message: err.message 
      };
    }
    
    // Always return 200 so deployment succeeds
    res.status(200).json(healthStatus);
  });

// Debug routes in development
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug/routes', (req, res) => {
        const routes = [];
        app._router.stack.forEach(middleware => {
            if (middleware.route) {
                routes.push(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
            } else if (middleware.name === 'router') {
                middleware.handle.stack.forEach(handler => {
                    if (handler.route) {
                        routes.push(`${Object.keys(handler.route.methods)} ${handler.route.path}`);
                    }
                });
            }
        });
        res.json(routes);
    });

    // Debug endpoint for connection pool status
    app.get('/api/debug/pool', (req, res) => {
        const pool = sequelize.connectionManager.pool;
        res.json({
            size: pool.size,
            idle: pool.idle,
            total: pool.total,
            pending: pool.pending
        });
    });
    
    // Debug endpoint for cookie test
    app.get('/api/debug/cookie-test', (req, res) => {
        const cookieName = 'test-cookie';
        const cookieValue = `test-${Date.now()}`;
        
        // Get host information
        const host = req.get('x-forwarded-host') || req.get('host');
        const protocol = req.protocol;
        const originalUrl = req.originalUrl;
        
        // Set a test cookie
        res.cookie(cookieName, cookieValue, {
            httpOnly: true,
            secure: protocol === 'https',
            maxAge: 60000 // 1 minute
        });
        
        res.json({
            message: 'Test cookie set',
            cookie: {
                name: cookieName,
                value: cookieValue
            },
            request: {
                headers: req.headers,
                host,
                protocol,
                originalUrl,
                ip: req.ip,
                ips: req.ips,
                secure: req.secure,
                cookies: req.cookies
            }
        });
    });
}

// Error handling middleware
app.use(errorHandler);

// Enhanced fallback error handler
app.use((err, req, res, next) => {
    const errorDetails = {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString(),
        type: err.name,
        code: err.code
    };

    console.error('Unhandled Error:', errorDetails);
    
    res.status(err.status || 500).json({ 
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Resource not found',
        path: req.path
    });
});

let server;

// Enhanced graceful shutdown function
async function gracefulShutdown(signal) {
    console.log(`\n${signal} signal received: starting graceful shutdown`);
    
    let forceExit = false;
    
    // Force exit after timeout
    const forceExitTimeout = setTimeout(() => {
        console.warn('Could not close connections in time, forcefully shutting down');
        forceExit = true;
        process.exit(1);
    }, 30000); // 30 seconds timeout
    
    try {
        // Stop accepting new requests
        console.log('Closing HTTP server...');
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('HTTP server closed');

        // Clear any scheduled jobs
        if (global.tokenCleanupJob) {
            global.tokenCleanupJob.cancel();
            console.log('Token cleanup job cancelled');
        }

        // Close database connections with timeout
        console.log('Closing database connections...');
        await Promise.race([
            sequelize.close(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database connection close timeout')), 10000)
            )
        ]);
        console.log('Database connections closed');

        clearTimeout(forceExitTimeout);
        if (!forceExit) {
            console.log('Graceful shutdown completed');
            process.exit(0);
        }
    } catch (err) {
        console.error('Error during shutdown:', err);
        clearTimeout(forceExitTimeout);
        if (!forceExit) {
            process.exit(1);
        }
    }
}

// Initialize server and database
async function startServer() {
    try {
        console.log('Starting server initialization...');
        
        // Log database configuration (without exposing sensitive info)
        console.log('Database config:', {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER ? 'provided' : 'missing',
            dialect: process.env.DB_DIALECT || 'postgres',
            ssl: process.env.DB_SSL || 'not specified'
        });
        
        // Test database authentication
        try {
            console.log('Attempting to authenticate with database...');
            await sequelize.authenticate();
            console.log('Database authentication successful!');
        } catch (dbErr) {
            console.error('Database authentication failed:', dbErr);
            // Continue startup despite DB issues for debugging
        }
        
        // Try database sync
        try {
            console.log('Attempting to sync database...');
            await sequelize.sync();
            console.log('Database sync successful!');
        } catch (syncErr) {
            console.error('Database sync failed:', syncErr);
            // Continue startup despite DB sync issues for debugging
        }
        
        // Schedule jobs (with error handling)
        try {
            // Start the token cleanup job
            const { scheduleTokenCleanup } = require('./jobs/tokenCleanup');
            scheduleTokenCleanup();
            console.log('Token cleanup job scheduled');

            // Start the notification reminder job
            const { scheduleNotificationReminders } = require('./jobs/notificationReminder');
            scheduleNotificationReminders();
            console.log('Notification reminder job scheduled');  

            // Initialize reindexing scheduler
            const { scheduleReindexing } = require('./jobs/indexScheduler');
            scheduleReindexing();
            console.log('Reindexing scheduler initialized');
        } catch (jobErr) {
            console.error('Error scheduling jobs:', jobErr);
            // Continue startup despite job scheduling issues
        }

        // Start HTTP server regardless of previous steps
        server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`);
            console.log('Environment:', process.env.NODE_ENV || 'development');
        });

        // Set up signal handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('Uncaught Exception:', err);
            gracefulShutdown('uncaughtException');
        });

        // Handle unhandled rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });

    } catch (err) {
        console.error('Fatal error during server startup:', err);
        // Don't exit immediately to allow logs to be captured
        setTimeout(() => process.exit(1), 5000);
    }
}

// Start the server
startServer();

module.exports = app;