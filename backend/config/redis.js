// =============================================================================
// REDIS CLIENT CONFIGURATION
// =============================================================================
// Redis digunakan untuk 2 tujuan utama:
// 1. CACHING: Cache-Aside pattern untuk mengurangi beban database
// 2. MESSAGE BROKER: BullMQ queue untuk async ticket purchase processing
//
// Library: ioredis (lebih powerful daripada 'redis' package)
// =============================================================================

const Redis = require('ioredis');

// -----------------------------------------------------------------------------
// REDIS CONNECTION CONFIGURATION
// -----------------------------------------------------------------------------
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,

    // Database index (0-15, default: 0)
    db: 0,

    // -----------------------------------------------------------------------------
    // CONNECTION SETTINGS untuk High Availability
    // -----------------------------------------------------------------------------
    maxRetriesPerRequest: 3,        // Max retry per request
    enableReadyCheck: true,          // Pastikan Redis siap sebelum digunakan
    enableOfflineQueue: true,        // Queue commands saat offline

    // Reconnection strategy
    retryStrategy(times) {
        // Retry dengan exponential backoff
        // Retry 1: 50ms, Retry 2: 100ms, Retry 3: 200ms, dst
        // Max delay: 3 detik
        const delay = Math.min(times * 50, 3000);

        if (times > 20) {
            // Setelah 20 kali retry, hentikan dan throw error
            console.error('✗ Redis connection failed after 20 retries');
            return null; // Stop retrying
        }

        console.log(`⟳ Retrying Redis connection (attempt ${times})...`);
        return delay;
    },

    // Reconnect on error
    reconnectOnError(err) {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];

        // Reconnect jika error termasuk dalam targetErrors
        if (targetErrors.some(targetError => err.message.includes(targetError))) {
            console.log('⟳ Reconnecting Redis due to error:', err.message);
            return true; // Reconnect
        }

        return false; // Tidak reconnect
    },

    // Connection timeout
    connectTimeout: 10000, // 10 detik

    // Lazy connect (connect saat first command, bukan saat instantiate)
    lazyConnect: false
};

// -----------------------------------------------------------------------------
// CREATE REDIS CLIENT INSTANCE
// -----------------------------------------------------------------------------
const redisClient = new Redis(redisConfig);

// -----------------------------------------------------------------------------
// EVENT HANDLERS untuk monitoring dan debugging
// -----------------------------------------------------------------------------

// Event: Connection berhasil
redisClient.on('connect', () => {
    console.log('⟳ Redis client connecting...');
});

redisClient.on('ready', () => {
    console.log('✓ Redis client connected and ready');
});

// Event: Error
redisClient.on('error', (err) => {
    console.error('✗ Redis client error:', err.message);
});

// Event: Connection tertutup
redisClient.on('close', () => {
    console.log('⊗ Redis connection closed');
});

// Event: Reconnecting
redisClient.on('reconnecting', (delay) => {
    console.log(`⟳ Redis reconnecting in ${delay}ms...`);
});

// Event: Connection berakhir (tidak akan reconnect)
redisClient.on('end', () => {
    console.log('⊗ Redis connection ended');
});

// -----------------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// -----------------------------------------------------------------------------
// Function untuk menutup koneksi Redis dengan benar
const closeRedisConnection = async () => {
    try {
        await redisClient.quit(); // Graceful shutdown (tunggu pending commands selesai)
        console.log('✓ Redis connection closed gracefully');
    } catch (error) {
        console.error('✗ Error closing Redis connection:', error);
        // Force close jika graceful shutdown gagal
        redisClient.disconnect();
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    await closeRedisConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeRedisConnection();
    process.exit(0);
});

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
module.exports = redisClient;
module.exports.closeConnection = closeRedisConnection;
