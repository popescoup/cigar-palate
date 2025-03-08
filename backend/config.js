// backend/config.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const Redis = require('ioredis');

// Initialize Sequelize using environment variables
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    pool: {
        max: 5,                      // Maximum number of connection in pool
        min: 0,                      // Minimum number of connection in pool
        acquire: 30000,              // Maximum time (ms) that pool will try to get connection before throwing error
        idle: 10000                  // Maximum time (ms) that a connection can be idle before being released
    },
    dialectOptions: {
        statement_timeout: 10000,    // Timeout for queries (10 seconds)
        idle_in_transaction_session_timeout: 10000 // Timeout for idle transactions
    },
    retry: {
        max: 5,                      // Maximum number of connection retries
        backoffBase: 3000,           // Start with a 3 second backoff
        backoffExponent: 1.1         // Increase backoff time slightly with each retry
    },
    logging: process.env.NODE_ENV === 'development' ? 
        (msg) => console.log(`[Sequelize] ${msg}`) : 
        false
});

// Enhanced connection retry function
async function connectWithRetry(retries = 5, initialDelay = 3000) {
    let currentDelay = initialDelay;
    let attempt = 1;

    while (retries) {
        try {
            await sequelize.authenticate();
            console.log('Database connected successfully');
            return true;
        } catch (err) {
            retries--;
            console.error(`Connection attempt ${attempt} failed. Error:`, err.message);
            
            if (retries === 0) {
                console.error('Maximum connection attempts reached. Unable to connect to database.');
                throw new Error('Failed to connect to database after multiple attempts');
            }

            console.log(`Retrying in ${currentDelay / 1000} seconds... (${retries} attempts remaining)`);
            await new Promise(res => setTimeout(res, currentDelay));
            
            // Increase delay for next attempt (with maximum of 10 seconds)
            currentDelay = Math.min(currentDelay * 1.5, 10000);
            attempt++;
        }
    }
}

// Modified RedisClient Class
class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.maxRetryAttempts = 5;
        this.enabled = !!process.env.REDIS_HOST; // Check if Redis is configured
    }

    async connect() {
        if (!this.enabled) {
            return null;
        }
        
        if (this.client) return this.client;

        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                retryStrategy: (times) => {
                    if (times > this.maxRetryAttempts) {
                        console.error('Max Redis retry attempts reached');
                        return null;
                    }
                    const delay = Math.min(times * 100, 3000);
                    return delay;
                },
                maxRetriesPerRequest: 3
            });

            this.client.on('connect', () => {
                console.log('Redis client connected');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                console.error('Redis client error:', err);
                this.isConnected = false;
            });

            await this.client.ping();
            return this.client;
        } catch (error) {
            console.error('Redis connection error:', error);
            this.enabled = false;
            return null;
        }
    }

    async set(key, value, expireTime = 3600) {
        if (!this.enabled) return;
        
        try {
            if (!this.client) await this.connect();
            if (!this.client) return;
            
            if (typeof value === 'object') value = JSON.stringify(value);
            await this.client.set(key, value, 'EX', expireTime);
        } catch (error) {
            console.error(`Redis set error for key ${key}:`, error);
        }
    }

    async get(key) {
        if (!this.enabled) return null;
        
        try {
            if (!this.client) await this.connect();
            if (!this.client) return null;
            
            const value = await this.client.get(key);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.error(`Redis get error for key ${key}:`, error);
            return null;
        }
    }

    async delete(key) {
        if (!this.enabled) return;
        
        try {
            if (!this.client) await this.connect();
            if (!this.client) return;
            
            await this.client.del(key);
        } catch (error) {
            console.error(`Redis delete error for key ${key}:`, error);
        }
    }

    async setHash(key, field, value, expireTime = 3600) {
        if (!this.enabled) return;
        
        try {
            if (!this.client) await this.connect();
            if (!this.client) return;
            
            if (typeof value === 'object') value = JSON.stringify(value);
            await this.client.hset(key, field, value);
            await this.client.expire(key, expireTime);
        } catch (error) {
            console.error(`Redis setHash error for key ${key}:`, error);
        }
    }

    async getHash(key, field) {
        if (!this.enabled) return null;
        
        try {
            if (!this.client) await this.connect();
            if (!this.client) return null;
            
            const value = await this.client.hget(key, field);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.error(`Redis getHash error for key ${key}:`, error);
            return null;
        }
    }

    async quit() {
        if (this.client) {
            try {
                await this.client.quit();
            } catch (error) {
                console.error('Redis quit error:', error);
            } finally {
                this.client = null;
                this.isConnected = false;
            }
        }
    }
}

// Initialize database connection
connectWithRetry();

// Create Redis client instance
const redis = new RedisClient();

// Configuration object
const config = {
    smtp: {
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    },
    database: {
        maxConnections: 5,
        minConnections: 0,
        idleTimeout: 10000,
        acquireTimeout: 30000
    }
};

// Export database health check function
const checkDatabaseHealth = async () => {
    try {
        await sequelize.authenticate();
        const pool = sequelize.connectionManager.pool;
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            pool: pool ? {
                size: pool.size,
                idle: pool.idle,
                total: pool.total
            } : 'Pool information not available'
        };
    } catch (err) {
        return {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: err.message
        };
    }
};

// Exports
module.exports = sequelize;
module.exports.config = config;
module.exports.redis = redis;
module.exports.checkDatabaseHealth = checkDatabaseHealth;