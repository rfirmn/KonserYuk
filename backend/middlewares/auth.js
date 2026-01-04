// =============================================================================
// AUTHENTICATION MIDDLEWARE - JWT dengan HttpOnly Cookies
// =============================================================================
// Middleware ini memvalidasi JWT access token yang dikirim via HttpOnly cookie
// 
// PERUBAHAN DARI VERSI LAMA:
// - SEBELUM: Token dibaca dari Authorization header (Bearer token)
// - SEKARANG: Token dibaca dari HttpOnly cookie (lebih aman, CSRF-protected)
//
// KEAMANAN:
// - HttpOnly cookie tidak bisa diakses JavaScript (XSS protection)
// - SameSite policy untuk CSRF protection
// - Short-lived access token (15 menit)
// - Refresh token untuk mendapatkan access token baru
// =============================================================================

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// -----------------------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE - Validasi Access Token dari Cookie
// -----------------------------------------------------------------------------
/**
 * Middleware untuk memvalidasi JWT access token dari cookie
 * Jika token valid, user data akan di-attach ke req.user
 * Jika tidak valid, return 401 Unauthorized
 */
const authMiddleware = async (req, res, next) => {
  try {
    // -------------------------------------------------------------------------
    // STEP 1: Ambil token dari cookie (bukan dari header)
    // -------------------------------------------------------------------------
    // Cookie di-parse oleh cookie-parser middleware
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
        code: 'NO_TOKEN'
      });
    }

    // -------------------------------------------------------------------------
    // STEP 2: Verify dan decode JWT token
    // -------------------------------------------------------------------------
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || 'your-secret-key'
      );
    } catch (jwtError) {
      // Handle JWT-specific errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token sudah expired. Silakan refresh token atau login kembali.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token tidak valid.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError; // Re-throw jika error lain
      }
    }

    // -------------------------------------------------------------------------
    // STEP 3: Validasi user masih exists di database
    // -------------------------------------------------------------------------
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refresh_token'] } // Jangan return password
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan. Token tidak valid.',
        code: 'USER_NOT_FOUND'
      });
    }

    // -------------------------------------------------------------------------
    // STEP 4: Attach user ke request object
    // -------------------------------------------------------------------------
    // User data bisa diakses di controller dengan req.user
    req.user = user;

    // Continue ke next middleware/controller
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Autentikasi gagal. Token tidak valid atau expired.',
      code: 'AUTH_FAILED'
    });
  }
};

// -----------------------------------------------------------------------------
// ADMIN MIDDLEWARE - Validasi role admin
// -----------------------------------------------------------------------------
/**
 * Middleware untuk memvalidasi user adalah admin
 * HARUS dipanggil SETELAH authMiddleware
 */
const adminMiddleware = (req, res, next) => {
  // Pastikan authMiddleware sudah jalan dan req.user sudah ada
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Silakan login terlebih dahulu.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Check role
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang diizinkan.',
      code: 'FORBIDDEN'
    });
  }

  // User adalah admin, lanjutkan
  next();
};

// -----------------------------------------------------------------------------
// OPTIONAL AUTH MIDDLEWARE - untuk endpoint yang bisa diakses dengan/tanpa auth
// -----------------------------------------------------------------------------
/**
 * Middleware opsional untuk endpoint yang bisa diakses public
 * tapi bisa memberikan data tambahan jika user authenticated
 * 
 * Contoh use case: Event listing (public) tapi show "Purchased" badge jika user login
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;

    // Jika tidak ada token, skip
    if (!token) {
      req.user = null;
      return next();
    }

    // Jika ada token, coba verify
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || 'your-secret-key'
      );

      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'refresh_token'] }
      });

      req.user = user || null;
    } catch (error) {
      // Jika token invalid, set user = null (tidak error)
      req.user = null;
    }

    next();
  } catch (error) {
    // Jika ada error, set user = null dan lanjut (tidak block request)
    req.user = null;
    next();
  }
};

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware
};