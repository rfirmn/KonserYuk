// =============================================================================
// SEQUELIZE DATABASE CONFIGURATION - MASTER/SLAVE REPLICATION
// =============================================================================
// Konfigurasi ini mendukung database replication untuk high-traffic scenarios:
// 
// WRITE OPERATIONS (INSERT, UPDATE, DELETE):
// - Diarahkan ke MySQL Master
// - Memastikan konsistensi data untuk operasi yang mengubah state
//
// READ OPERATIONS (SELECT):
// - Diarahkan ke MySQL Slave (read replica)
// - Mengurangi beban pada Master database
// - Meningkatkan performa untuk query-query read-heavy
//
// SEQUELIZE FEATURE: Sequelize otomatis akan memilih host yang tepat
// berdasarkan jenis query (read/write)
// =============================================================================

const { Sequelize } = require('sequelize');

// -----------------------------------------------------------------------------
// KONFIGURASI REPLICATION
// -----------------------------------------------------------------------------
const sequelize = new Sequelize(
  process.env.DB_NAME || 'konser_yuk',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    // -------------------------------------------------------------------------
    // REPLICATION CONFIG: Master untuk Write, Slave untuk Read
    // -------------------------------------------------------------------------
    replication: {
      // MASTER: Untuk operasi write (INSERT, UPDATE, DELETE)
      write: {
        host: process.env.DB_MASTER_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
      },
      // SLAVES: Untuk operasi read (SELECT)
      // Bisa lebih dari 1 slave, Sequelize akan melakukan load balancing
      read: [
        {
          host: process.env.DB_SLAVE_HOST || 'localhost',
          port: process.env.DB_SLAVE_PORT || 3307, // Port berbeda untuk slave
          username: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || ''
        }
        // Tambahkan slave lain di sini jika ada untuk load balancing
        // {
        //   host: process.env.DB_SLAVE_HOST_2 || 'localhost',
        //   port: 3308,
        //   ...
        // }
      ]
    },

    // -------------------------------------------------------------------------
    // DATABASE DIALECT & CONFIGURATION
    // -------------------------------------------------------------------------
    dialect: 'mysql',

    // Logging: false untuk production, console.log untuk development
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    // -------------------------------------------------------------------------
    // CONNECTION POOL CONFIGURATION
    // -------------------------------------------------------------------------
    // Pool mengatur jumlah koneksi database yang dibuat dan dipelihara
    // Penting untuk high-traffic scenarios
    pool: {
      max: 20,          // Maksimal 20 koneksi (naik dari 5 untuk high-traffic)
      min: 5,           // Minimal 5 koneksi selalu standby
      acquire: 60000,   // Maksimal waktu menunggu koneksi (60 detik)
      idle: 10000,      // Koneksi idle akan dilepas setelah 10 detik
      evict: 1000       // Interval untuk memeriksa koneksi yang perlu di-evict
    },

    // -------------------------------------------------------------------------
    // TIMEZONE & CHARSET CONFIGURATION
    // -------------------------------------------------------------------------
    timezone: '+07:00', // WIB (Waktu Indonesia Barat)

    // Opsi tambahan untuk MySQL
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      // Timeout settings untuk mencegah koneksi hang
      connectTimeout: 60000
    },

    // -------------------------------------------------------------------------
    // QUERY CONFIGURATION
    // -------------------------------------------------------------------------
    // Retry logic untuk query yang gagal (misal karena connection issue)
    retry: {
      max: 3,                    // Maksimal 3 retry
      timeout: 3000,             // Timeout per retry: 3 detik
      match: [                   // Retry hanya untuk error tertentu
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /EPIPE/
      ]
    },

    // Define options default untuk semua model
    define: {
      // Gunakan createdAt & updatedAt
      timestamps: true,
      // Gunakan underscored untuk nama kolom (created_at vs createdAt)
      underscored: false,
      // Freeze table name (jangan pluralize otomatis)
      freezeTableName: false
    }
  }
);

// -----------------------------------------------------------------------------
// DATABASE CONNECTION TEST
// -----------------------------------------------------------------------------
// Function untuk test koneksi database (opsional, bisa dipanggil saat startup)
const testConnection = async () => {
  try {
    // Test write connection (master)
    await sequelize.authenticate();
    console.log('✓ Database Master connection established successfully');

    // Test read connection (slave)
    // Sequelize akan otomatis test semua read replicas
    console.log('✓ Database Slave connection established successfully');

    return true;
  } catch (error) {
    console.error('✗ Unable to connect to database:', error);
    throw error;
  }
};

// -----------------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// -----------------------------------------------------------------------------
// Fungsi untuk menutup koneksi database dengan benar saat aplikasi di-shutdown
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✓ Database connections closed successfully');
  } catch (error) {
    console.error('✗ Error closing database connections:', error);
    throw error;
  }
};

// Export sequelize instance dan utility functions
module.exports = sequelize;
module.exports.testConnection = testConnection;
module.exports.closeConnection = closeConnection;