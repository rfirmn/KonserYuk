// =============================================================================
// CACHE UTILITY - REDIS CACHE-ASIDE PATTERN
// =============================================================================
// Cache-Aside (Lazy Loading) Pattern:
// 1. Aplikasi CEK CACHE terlebih dahulu
// 2. Jika CACHE HIT: return data dari cache
// 3. Jika CACHE MISS: ambil dari database, simpan ke cache, return data
// 4. Saat UPDATE/DELETE: invalidate cache yang terkait
//
// KEUNTUNGAN:
// - Mengurangi beban database untuk query yang sering diakses
// - Meningkatkan response time untuk data yang di-cache
// - Automatic cache warming (hanya data yang diakses yang di-cache)
// =============================================================================

const redisClient = require('../config/redis');

// -----------------------------------------------------------------------------
// CACHE KEY GENERATOR
// -----------------------------------------------------------------------------
// Generate cache key yang konsisten dan mudah di-invalidate

/**
 * Generate cache key untuk event list
 * @param {Object} queryParams - Query parameters dari request
 * @returns {string} Redis cache key
 */
function generateEventListKey(queryParams = {}) {
    // Serialize query params ke string
    const params = new URLSearchParams(queryParams).toString();
    return `events:list:${params || 'all'}`;
}

/**
 * Generate cache key untuk single event
 * @param {number|string} eventId - Event ID
 * @returns {string} Redis cache key
 */
function generateEventKey(eventId) {
    return `event:${eventId}`;
}

// -----------------------------------------------------------------------------
// CACHE OPERATIONS
// -----------------------------------------------------------------------------

/**
 * GET data dari cache
 * @param {string} key - Redis key
 * @returns {Promise<any|null>} Parsed data atau null jika tidak ada/expired
 */
async function getCache(key) {
    try {
        const data = await redisClient.get(key);

        if (!data) {
            console.log(`⊗ Cache MISS: ${key}`);
            return null;
        }

        console.log(`✓ Cache HIT: ${key}`);

        // Parse JSON string kembali ke object
        return JSON.parse(data);
    } catch (error) {
        console.error(`✗ Error getting cache for key ${key}:`, error.message);
        // Jika Redis error, return null agar aplikasi tetap jalan (fallback ke DB)
        return null;
    }
}

/**
 * SET data ke cache dengan TTL
 * @param {string} key - Redis key
 * @param {any} value - Data yang akan di-cache (akan di-JSON.stringify)
 * @param {number} [ttl=3600] - Time to live dalam detik (default: 1 jam)
 * @returns {Promise<boolean>} Success status
 */
async function setCache(key, value, ttl = 3600) {
    try {
        // Convert object ke JSON string
        const stringValue = JSON.stringify(value);

        // SET dengan expiry time (EX = seconds)
        await redisClient.set(key, stringValue, 'EX', ttl);

        console.log(`✓ Cache SET: ${key} (TTL: ${ttl}s)`);
        return true;
    } catch (error) {
        console.error(`✗ Error setting cache for key ${key}:`, error.message);
        // Jika Redis error, return false tapi aplikasi tetap jalan
        return false;
    }
}

/**
 * DELETE single cache key
 * @param {string} key - Redis key to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteCache(key) {
    try {
        const result = await redisClient.del(key);

        if (result > 0) {
            console.log(`✓ Cache DELETED: ${key}`);
            return true;
        } else {
            console.log(`⊗ Cache key not found: ${key}`);
            return false;
        }
    } catch (error) {
        console.error(`✗ Error deleting cache for key ${key}:`, error.message);
        return false;
    }
}

/**
 * DELETE multiple cache keys by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'events:*')
 * @returns {Promise<number>} Number of keys deleted
 */
async function deleteCachePattern(pattern) {
    try {
        // SCAN untuk mendapatkan semua keys yang match pattern
        // Lebih aman daripada KEYS di production (non-blocking)
        const keys = [];
        let cursor = '0';

        do {
            // SCAN dengan pattern matching
            const result = await redisClient.scan(
                cursor,
                'MATCH', pattern,
                'COUNT', 100
            );

            cursor = result[0];
            keys.push(...result[1]);
        } while (cursor !== '0');

        if (keys.length === 0) {
            console.log(`⊗ No cache keys match pattern: ${pattern}`);
            return 0;
        }

        // Delete all matched keys
        const result = await redisClient.del(...keys);
        console.log(`✓ Cache DELETED (pattern: ${pattern}): ${result} keys`);

        return result;
    } catch (error) {
        console.error(`✗ Error deleting cache pattern ${pattern}:`, error.message);
        return 0;
    }
}

/**
 * INVALIDATE all event-related caches
 * Dipanggil setelah create/update/delete event
 * @returns {Promise<number>} Number of keys deleted
 */
async function invalidateEventCaches() {
    try {
        let totalDeleted = 0;

        // Delete all event list caches
        totalDeleted += await deleteCachePattern('events:list:*');

        // Delete all single event caches
        totalDeleted += await deleteCachePattern('event:*');

        console.log(`✓ Invalidated ${totalDeleted} event cache(s)`);
        return totalDeleted;
    } catch (error) {
        console.error('✗ Error invalidating event caches:', error);
        return 0;
    }
}

/**
 * GET cache dengan auto-refresh (Cache-Aside Pattern helper)
 * @param {string} key - Redis key
 * @param {Function} fetchFunction - Async function untuk fetch data dari DB jika cache miss
 * @param {number} [ttl=3600] - TTL dalam detik
 * @returns {Promise<any>} Data (dari cache atau DB)
 */
async function getCacheOrFetch(key, fetchFunction, ttl = 3600) {
    try {
        // 1. Cek cache terlebih dahulu
        let data = await getCache(key);

        // 2. Jika cache HIT, return langsung
        if (data !== null) {
            return data;
        }

        // 3. Jika cache MISS, fetch dari database
        console.log(`⟳ Fetching data from database for key: ${key}`);
        data = await fetchFunction();

        // 4. Simpan ke cache (jangan block response)
        setCache(key, data, ttl).catch(err => {
            console.error('Failed to set cache:', err);
        });

        // 5. Return data
        return data;
    } catch (error) {
        console.error(`✗ Error in getCacheOrFetch for key ${key}:`, error);
        // Jika error, langsung fetch dari database (fallback)
        return await fetchFunction();
    }
}

// -----------------------------------------------------------------------------
// CACHE TTL CONSTANTS
// -----------------------------------------------------------------------------
// Konstanta untuk TTL berbagai jenis cache
const CACHE_TTL = {
    EVENT_LIST: parseInt(process.env.CACHE_TTL) || 3600,     // 1 jam
    SINGLE_EVENT: parseInt(process.env.CACHE_TTL) || 3600,   // 1 jam
    SHORT_LIVED: 300,                                          // 5 menit
    LONG_LIVED: 7200                                          // 2 jam
};

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
module.exports = {
    // Core cache operations
    getCache,
    setCache,
    deleteCache,
    deleteCachePattern,

    // Cache-Aside helper
    getCacheOrFetch,

    // Event-specific utilities
    generateEventListKey,
    generateEventKey,
    invalidateEventCaches,

    // Constants
    CACHE_TTL
};
