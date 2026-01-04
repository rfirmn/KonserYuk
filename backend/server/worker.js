// =============================================================================
// WORKER SERVER - Standalone BullMQ Worker Process
// =============================================================================
// File ini digunakan untuk menjalankan worker secara terpisah dari HTTP server
//
// CARA MENJALANKAN:
// - Development: node server/worker.js
// - Docker: akan di-run otomatis sebagai service terpisah
// - Production: gunakan PM2 atau supervisor untuk process management
//
// BENEFIT SEPARATE WORKER:
// - HTTP server fokus handle requests (stateless)
// - Worker fokus process jobs (stateful, long-running)
// - Bisa di-scale independently (1 HTTP server, 3 workers, dll)
// - Restart worker tidak affect HTTP server
// =============================================================================

require('dotenv').config();
const database = require('../config/database');
const redisClient = require('../config/redis');

// -----------------------------------------------------------------------------
// STARTUP SEQUENCE
// -----------------------------------------------------------------------------
async function startWorker() {
    console.log('='.repeat(70));
    console.log('🚀 STARTING TICKET PURCHASE WORKER');
    console.log('='.repeat(70));

    try {
        // -------------------------------------------------------------------------
        // STEP 1: Test database connection
        // -------------------------------------------------------------------------
        console.log('\n[1/3] Testing database connection...');
        await database.authenticate();
        console.log('✓ Database connected successfully');

        // -------------------------------------------------------------------------
        // STEP 2: Test Redis connection
        // -------------------------------------------------------------------------
        console.log('\n[2/3] Testing Redis connection...');
        await redisClient.ping();
        console.log('✓ Redis connected successfully');

        // -------------------------------------------------------------------------
        // STEP 3: Start worker
        // -------------------------------------------------------------------------
        console.log('\n[3/3] Starting BullMQ worker...');
        const worker = require('../workers/ticketPurchase.worker');
        console.log('✓ Worker started successfully');

        console.log('\n' + '='.repeat(70));
        console.log('✓ WORKER IS READY TO PROCESS JOBS');
        console.log('='.repeat(70));
        console.log(`Worker Concurrency: ${process.env.WORKER_CONCURRENCY || 5}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n✗ Failed to start worker:', error);
        process.exit(1);
    }
}

// -----------------------------------------------------------------------------
// START THE WORKER
// -----------------------------------------------------------------------------
startWorker();

// -----------------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// -----------------------------------------------------------------------------
process.on('SIGTERM', async () => {
    console.log('\n⊗ SIGTERM received, shutting down gracefully...');

    try {
        await database.close();
        await redisClient.quit();
        console.log('✓ Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('\n⊗ SIGINT received, shutting down gracefully...');

    try {
        await database.close();
        await redisClient.quit();
        console.log('✓ Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error during shutdown:', error);
        process.exit(1);
    }
});
