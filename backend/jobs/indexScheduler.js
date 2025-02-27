// jobs/scheduler.js
const cron = require('node-cron');
const { reindexAll } = require('../scripts/reindex');

// Utility to log with timestamp
const logWithTimestamp = (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
};

// Schedule reindexing to run every 24 hours at 3 AM
// Using 3 AM as it's typically a low-traffic time
const scheduleReindexing = () => {
    cron.schedule('0 3 * * *', async () => {
        logWithTimestamp('Starting scheduled reindexing...');
        try {
            await reindexAll();
            logWithTimestamp('Scheduled reindexing completed successfully');
        } catch (error) {
            logWithTimestamp(`Scheduled reindexing failed: ${error.message}`);
            // You might want to add error notification here (e.g., email admin)
        }
    }, {
        timezone: "UTC"  // Explicitly set timezone
    });
    
    logWithTimestamp('Reindexing scheduler initialized');
};

module.exports = {
    scheduleReindexing
};