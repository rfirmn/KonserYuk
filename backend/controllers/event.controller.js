// =============================================================================
// EVENT CONTROLLER - dengan REDIS Cache-Aside Pattern
// =============================================================================
// Controller ini sudah direfactor dengan Redis caching untuk high-traffic:
//
// CACHE STRATEGY (Cache-Aside Pattern):
// 1. getAllEvents & getEventById: CEK CACHE terlebih dahulu
// 2. Jika CACHE HIT: return langsung dari Redis (fast!)
// 3. Jika CACHE MISS: ambil dari database, simpan ke cache, return
// 4. Saat CREATE/UPDATE/DELETE: INVALIDATE cache yang terkait
//
// BENEFIT:
// - Mengurangi beban database hingga 80-90% untuk read operations  
// - Response time jauh lebih cepat (Redis: <1ms vs MySQL: 10-100ms)
// - Database slave bisa fokus untuk complex queries
// =============================================================================

const { Event } = require('../models');
const { Op } = require('sequelize');
const {
  getCacheOrFetch,
  generateEventListKey,
  generateEventKey,
  invalidateEventCaches,
  CACHE_TTL
} = require('../utils/cache');

// -----------------------------------------------------------------------------
// GET ALL EVENTS - dengan Redis caching
// -----------------------------------------------------------------------------
/**
 * Get all events dengan filter dan caching
 * Cache key berbeda untuk setiap kombinasi query parameters
 */
const getAllEvents = async (req, res) => {
  try {
    const { search, lokasi, tanggal, minHarga, maxHarga } = req.query;

    // -------------------------------------------------------------------------
    // STEP 1: Generate cache key berdasarkan query parameters
    // -------------------------------------------------------------------------
    // Contoh key: "events:list:search=konser&lokasi=jakarta"
    const cacheKey = generateEventListKey(req.query);

    // -------------------------------------------------------------------------
    // STEP 2: Try get from cache, or fetch from database
    // -------------------------------------------------------------------------
    const events = await getCacheOrFetch(
      cacheKey,
      async () => {
        // Function ini hanya dipanggil jika cache MISS
        console.log('⟳ Cache MISS, fetching events from database...');

        // Build WHERE clause berdasarkan query parameters
        let whereClause = {};

        if (search) {
          whereClause.nama = { [Op.like]: `%${search}%` };
        }

        if (lokasi) {
          whereClause.lokasi = { [Op.like]: `%${lokasi}%` };
        }

        if (tanggal) {
          whereClause.tanggal = { [Op.gte]: new Date(tanggal) };
        }

        if (minHarga && maxHarga) {
          whereClause.harga = { [Op.between]: [minHarga, maxHarga] };
        }

        // Query ke database (otomatis ke SLAVE untuk read operation)
        const eventsFromDb = await Event.findAll({
          where: whereClause,
          order: [['tanggal', 'ASC']]
        });

        return eventsFromDb;
      },
      CACHE_TTL.EVENT_LIST // TTL: 1 jam
    );

    // Response
    res.json({
      success: true,
      data: events,
      cached: true // Info untuk debugging
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data event'
    });
  }
};

// -----------------------------------------------------------------------------
// GET EVENT BY ID - dengan Redis caching
// -----------------------------------------------------------------------------
/**
 * Get single event by ID dengan caching
 * Cache key: "event:{id}"
 */
const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;

    // -------------------------------------------------------------------------
    // STEP 1: Generate cache key untuk single event
    // -------------------------------------------------------------------------
    const cacheKey = generateEventKey(eventId);

    // -------------------------------------------------------------------------
    // STEP 2: Try get from cache, or fetch from database
    // -------------------------------------------------------------------------
    const event = await getCacheOrFetch(
      cacheKey,
      async () => {
        // Function ini hanya dipanggil jika cache MISS
        console.log(`⟳ Cache MISS for event ${eventId}, fetching from database...`);

        // Query ke database (otomatis ke SLAVE)
        const eventFromDb = await Event.findByPk(eventId);

        return eventFromDb;
      },
      CACHE_TTL.SINGLE_EVENT // TTL: 1 jam
    );

    // -------------------------------------------------------------------------
    // STEP 3: Validate result
    // -------------------------------------------------------------------------
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }

    // Response
    res.json({
      success: true,
      data: event,
      cached: true
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data event'
    });
  }
};

// -----------------------------------------------------------------------------
// CREATE EVENT - dengan cache invalidation
// -----------------------------------------------------------------------------
/**
 * Create new event dan invalidate semua event caches
 * Hanya admin yang bisa create event
 */
const createEvent = async (req, res) => {
  try {
    const { nama, lokasi, tanggal, harga, deskripsi, kuota, poster_url } = req.body;

    // -------------------------------------------------------------------------
    // STEP 1: Create event di database (otomatis ke MASTER)
    // -------------------------------------------------------------------------
    const event = await Event.create({
      nama,
      lokasi,
      tanggal,
      harga,
      deskripsi,
      kuota,
      poster_url
    });

    // -------------------------------------------------------------------------
    // STEP 2: INVALIDATE all event caches
    // -------------------------------------------------------------------------
    // Karena ada event baru, semua cache list harus di-invalidate
    // agar user melihat data terbaru
    await invalidateEventCaches();
    console.log('✓ Event caches invalidated after CREATE');

    // Response
    res.status(201).json({
      success: true,
      message: 'Event berhasil ditambahkan',
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan event'
    });
  }
};

// -----------------------------------------------------------------------------
// UPDATE EVENT - dengan cache invalidation
// -----------------------------------------------------------------------------
/**
 * Update existing event dan invalidate caches
 * Hanya admin yang bisa update event
 */
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // -------------------------------------------------------------------------
    // STEP 1: Find event
    // -------------------------------------------------------------------------
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }

    // -------------------------------------------------------------------------
    // STEP 2: Update event di database (otomatis ke MASTER)
    // -------------------------------------------------------------------------
    await event.update(req.body);

    // -------------------------------------------------------------------------
    // STEP 3: INVALIDATE all event caches
    // -------------------------------------------------------------------------
    // Karena ada perubahan, semua cache harus di-clear
    await invalidateEventCaches();
    console.log('✓ Event caches invalidated after UPDATE');

    // Response
    res.json({
      success: true,
      message: 'Event berhasil diupdate',
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate event'
    });
  }
};

// -----------------------------------------------------------------------------
// DELETE EVENT - dengan cache invalidation
// -----------------------------------------------------------------------------
/**
 * Delete event dan invalidate caches
 * Hanya admin yang bisa delete event
 */
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // -------------------------------------------------------------------------
    // STEP 1: Find event
    // -------------------------------------------------------------------------
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }

    // -------------------------------------------------------------------------
    // STEP 2: Delete event dari database (otomatis ke MASTER)
    // -------------------------------------------------------------------------
    await event.destroy();

    // -------------------------------------------------------------------------
    // STEP 3: INVALIDATE all event caches
    // -------------------------------------------------------------------------
    await invalidateEventCaches();
    console.log('✓ Event caches invalidated after DELETE');

    // Response
    res.json({
      success: true,
      message: 'Event berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus event'
    });
  }
};

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};