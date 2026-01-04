// =============================================================================
// BULLMQ QUEUE CONFIGURATION
// =============================================================================
// BullMQ adalah library message queue berbasis Redis untuk Node.js
// Digunakan untuk memproses pembelian tiket secara ASYNCHRONOUS
//
// KENAPA QUEUE DIPERLUKAN?
// 1. Mencegah RACE CONDITION saat flash sale (ribuan request bersamaan)
// 2. Memproses pembelian secara SERIAL dengan atomic operations
// 3. Mengurangi beban pada HTTP server (non-blocking)
// 4. Retry mechanism untuk failed transactions
// 5. Job tracking & monitoring
// =============================================================================

const { Queue } = require('bullmq');
const redisClient = require('./redis');

// -----------------------------------------------------------------------------
// QUEUE CONNECTION CONFIG
// -----------------------------------------------------------------------------
// Gunakan Redis yang sama untuk queue
const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,

    // Queue-specific settings
    maxRetriesPerRequest: null, // BullMQ merekomendasikan null
    enableReadyCheck: false,
    enableOfflineQueue: false
};

// -----------------------------------------------------------------------------
// TICKET PURCHASE QUEUE
// -----------------------------------------------------------------------------
// Queue khusus untuk memproses pembelian tiket
const ticketPurchaseQueue = new Queue('ticket-purchase', {
    connection,

    // -------------------------------------------------------------------------
    // DEFAULT JOB OPTIONS
    // -------------------------------------------------------------------------
    defaultJobOptions: {
        // Attempts: berapa kali job akan di-retry jika gagal
        attempts: 3,

        // Backoff: strategi retry (exponential delay)
        backoff: {
            type: 'exponential',
            delay: 2000 // Delay awal: 2 detik, lalu 4s, 8s, dst
        },

        // Job timeout: 30 detik
        timeout: parseInt(process.env.JOB_TIMEOUT) || 30000,

        // Remove job setelah selesai (untuk menghemat memory)
        // Keep completed: 100 jobs, failed: 50 jobs untuk debugging
        removeOnComplete: {
            age: 3600, // Remove setelah 1 jam
            count: 100 // Keep max 100 completed jobs
        },

        removeOnFail: {
            age: 7200, // Remove failed jobs setelah 2 jam
            count: 50  // Keep max 50 failed jobs
        }
    }
});

// -----------------------------------------------------------------------------
// QUEUE EVENT HANDLERS untuk monitoring
// -----------------------------------------------------------------------------

// Event: Job completed successfully
ticketPurchaseQueue.on('completed', (job, result) => {
    console.log(`✓ Job ${job.id} completed:`, result);
});

// Event: Job failed
ticketPurchaseQueue.on('failed', (job, err) => {
    console.error(`✗ Job ${job?.id} failed:`, err.message);
});

// Event: Job progress update (opsional)
ticketPurchaseQueue.on('progress', (job, progress) => {
    console.log(`⟳ Job ${job.id} progress: ${progress}%`);
});

// Event: Error pada queue
ticketPurchaseQueue.on('error', (err) => {
    console.error('✗ Queue error:', err);
});

// -----------------------------------------------------------------------------
// QUEUE UTILITY FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Tambahkan job pembelian tiket ke queue
 * @param {Object} jobData - Data pembelian tiket
 * @param {number} jobData.user_id - ID user yang membeli
 * @param {number} jobData.event_id - ID event yang dibeli
 * @param {string} [jobData.voucher_code] - Kode voucher (opsional)
 * @param {Object} [options] - Job options tambahan
 * @returns {Promise<Job>} Job instance
 */
async function addTicketPurchaseJob(jobData, options = {}) {
    try {
        // Tambahkan job ke queue dengan priority (opsional)
        const job = await ticketPurchaseQueue.add(
            'purchase', // Job name
            jobData,
            {
                // Merge dengan defaultJobOptions
                ...options,

                // Job ID unik berdasarkan timestamp dan user_id
                jobId: `purchase-${Date.now()}-${jobData.user_id}`,

                // Priority (1 = highest, 10 = lowest)
                // Bisa digunakan untuk VIP users
                priority: options.priority || 5
            }
        );

        console.log(`✓ Added ticket purchase job: ${job.id}`);
        return job;
    } catch (error) {
        console.error('✗ Failed to add job to queue:', error);
        throw error;
    }
}

/**
 * Get job status by job ID
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job status dan data
 */
async function getJobStatus(jobId) {
    try {
        const job = await ticketPurchaseQueue.getJob(jobId);

        if (!job) {
            return {
                status: 'not_found',
                message: 'Job tidak ditemukan'
            };
        }

        // Get job state
        const state = await job.getState();
        const progress = job.progress;
        const result = job.returnvalue;
        const failedReason = job.failedReason;

        return {
            status: state, // 'waiting', 'active', 'completed', 'failed', 'delayed'
            progress,
            result,
            failedReason,
            attempts: job.attemptsMade,
            data: job.data
        };
    } catch (error) {
        console.error('✗ Failed to get job status:', error);
        throw error;
    }
}

/**
 * Clean old jobs from queue
 * @param {number} grace - Grace period in milliseconds
 */
async function cleanQueue(grace = 3600000) {
    try {
        // Clean completed jobs older than 1 hour
        await ticketPurchaseQueue.clean(grace, 100, 'completed');

        // Clean failed jobs older than 2 hours
        await ticketPurchaseQueue.clean(grace * 2, 50, 'failed');

        console.log('✓ Queue cleaned successfully');
    } catch (error) {
        console.error('✗ Failed to clean queue:', error);
    }
}

// -----------------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// -----------------------------------------------------------------------------
async function closeQueue() {
    try {
        await ticketPurchaseQueue.close();
        console.log('✓ Queue closed successfully');
    } catch (error) {
        console.error('✗ Error closing queue:', error);
    }
}

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
module.exports = {
    ticketPurchaseQueue,
    addTicketPurchaseJob,
    getJobStatus,
    cleanQueue,
    closeQueue
};
