// =============================================================================
// MAIN SERVER - KONSER YUK BACKEND (Refactored for High-Traffic)
// =============================================================================
// Server ini sudah direfactor dengan fitur-fitur berikut:
// 1. JWT dual-token authentication dengan HttpOnly cookies
// 2. Redis caching dengan Cache-Aside pattern
// 3. BullMQ message queue untuk async ticket processing
// 4. Database replication (Master-Slave) untuk read/write separation
//
// PERUBAHAN DARI VERSI LAMA:
// - Added cookie-parser middleware untuk HttpOnly cookies
// - Added CORS configuration untuk credentials
// - Added Redis connection
// - Added graceful shutdown untuk Redis & queue connections
// =============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser'); // NEW: untuk parse cookies
const db = require('./config/database');
const redisClient = require('./config/redis'); // NEW: Redis connection

// Import routes
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const ticketRoutes = require('./routes/ticket.routes');
const voucherRoutes = require('./routes/voucher.routes');
const transactionRoutes = require('./routes/transaction.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------------------------------------------------------------
// MIDDLEWARE CONFIGURATION
// -----------------------------------------------------------------------------

// -------------------------------------------------------------------------
// CORS Configuration - dengan credentials support untuk cookies
// -------------------------------------------------------------------------
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from specified origins + development
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:5173'];

    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // IMPORTANT: Allow cookies to be sent
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// -------------------------------------------------------------------------
// Body Parser - untuk parse JSON dan URL-encoded data
// -------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------------------
// Cookie Parser - CRITICAL untuk HttpOnly cookie authentication
// -------------------------------------------------------------------------
app.use(cookieParser());

// -------------------------------------------------------------------------
// Morgan - HTTP request logger
// -------------------------------------------------------------------------
app.use(morgan('dev'));

// -----------------------------------------------------------------------------
// ROUTES CONFIGURATION
// -----------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);

// -----------------------------------------------------------------------------
// HEALTH CHECK ENDPOINT
// -----------------------------------------------------------------------------
/**
 * Health check endpoint untuk monitoring
 * Returns status dari database, Redis, dan server
 */
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.authenticate();
    const dbStatus = 'connected';

    // Check Redis connection
    let redisStatus = 'connected';
    try {
      await redisClient.ping();
    } catch (redisError) {
      redisStatus = 'disconnected';
    }

    res.json({
      status: 'OK',
      message: 'Konser Yuk API is running',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        server: 'running'
      },
      version: '2.0.0' // Refactored version
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      error: error.message
    });
  }
});

// -----------------------------------------------------------------------------
// ERROR HANDLING MIDDLEWARE
// -----------------------------------------------------------------------------
/**
 * Global error handler
 * Catches all unhandled errors dari routes
 */
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// -----------------------------------------------------------------------------
// 404 HANDLER - Route tidak ditemukan
// -----------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan',
    path: req.path
  });
});

// -----------------------------------------------------------------------------
// SERVER STARTUP
// -----------------------------------------------------------------------------
/**
 * Startup sequence:
 * 1. Test database connection (Master & Slave)
 * 2. Sync database models
 * 3. Test Redis connection
 * 4. Start HTTP server
 */
async function startServer() {
  try {
    console.log('='.repeat(70));
    console.log('🚀 STARTING KONSER YUK BACKEND SERVER');
    console.log('='.repeat(70));

    // -------------------------------------------------------------------------
    // STEP 1: Database Connection
    // -------------------------------------------------------------------------
    console.log('\n[1/4] Connecting to database...');
    await db.authenticate();
    console.log('✓ Database Master & Slave connected successfully');

    // -------------------------------------------------------------------------
    // STEP 2: Database Sync
    // -------------------------------------------------------------------------
    console.log('\n[2/4] Syncing database models...');
    await db.sync({ alter: true }); // alter: true untuk development
    console.log('✓ Database models synced');

    // -------------------------------------------------------------------------
    // STEP 3: Redis Connection
    // -------------------------------------------------------------------------
    console.log('\n[3/4] Connecting to Redis...');
    await redisClient.ping();
    console.log('✓ Redis connected successfully');

    // -------------------------------------------------------------------------
    // STEP 4: Start HTTP Server
    // -------------------------------------------------------------------------
    console.log('\n[4/4] Starting HTTP server...');
    app.listen(PORT, () => {
      console.log('✓ HTTP server started successfully');
      console.log('\n' + '='.repeat(70));
      console.log('✓ SERVER IS READY');
      console.log('='.repeat(70));
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(70) + '\n');
    });

  } catch (err) {
    console.error('\n✗ Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
startServer();

// -----------------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// -----------------------------------------------------------------------------
/**
 * Handle termination signals untuk graceful shutdown
 * Menutup koneksi database, Redis, dan queue sebelum shutdown
 */
async function gracefulShutdown(signal) {
  console.log(`\n⊗ ${signal} received, shutting down gracefully...`);

  try {
    // Close Redis connection
    console.log('Closing Redis connection...');
    await redisClient.quit();
    console.log('✓ Redis connection closed');

    // Close database connection
    console.log('Closing database connection...');
    await db.close();
    console.log('✓ Database connection closed');

    console.log('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error during shutdown:', error);
    process.exit(1);
  }
}

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠ Unhandled Rejection at:', promise, 'reason:', reason);
  // Aplikasi tetap jalan, tapi log error untuk debugging
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('⚠ Uncaught Exception:', error);
  // Untuk production, sebaiknya shutdown dan restart dengan PM2
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  }
});

module.exports = app;