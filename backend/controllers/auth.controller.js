// =============================================================================
// AUTHENTICATION CONTROLLER - DUAL-TOKEN JWT SYSTEM
// =============================================================================
// Implementasi sistem autentikasi dengan 2 jenis token:
//
// 1. ACCESS TOKEN (Short-lived: 15 menit)
//    - Dikirim sebagai HttpOnly cookie
//    - Digunakan untuk autentikasi setiap request
//    - Tidak disimpan di database (stateless JWT)
//
// 2. REFRESH TOKEN (Long-lived: 7 hari)
//    - Dikirim sebagai HttpOnly cookie
//    - Disimpan di database untuk validasi
//    - Digunakan untuk mendapatkan access token baru tanpa login ulang
//
// SECURITY FEATURES:
// - HttpOnly cookies (XSS protection)
// - SameSite policy (CSRF protection)
// - Refresh token rotation (security best practice)
// - Token stored in database untuk revocation capability
// =============================================================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { body, validationResult } = require('express-validator');

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS - Token Generation
// -----------------------------------------------------------------------------

/**
 * Generate access token (short-lived)
 * @param {Object} user - User object dari database
 * @returns {string} JWT access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_ACCESS_SECRET || 'your-access-secret',
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' // 15 menit
    }
  );
}

/**
 * Generate refresh token (long-lived)
 * @param {Object} user - User object dari database
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      // Tidak perlu data lain untuk refresh token
    },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' // 7 hari
    }
  );
}

/**
 * Set token cookies di response
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
function setTokenCookies(res, accessToken, refreshToken) {
  // Cookie options untuk security
  const cookieOptions = {
    httpOnly: true,    // Tidak bisa diakses JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only di production
    sameSite: process.env.COOKIE_SAMESITE || 'lax', // CSRF protection
    domain: process.env.COOKIE_DOMAIN || undefined, // Set domain if needed
    path: '/'
  };

  // Set access token cookie (15 menit)
  res.cookie('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 menit dalam milidetik
  });

  // Set refresh token cookie (7 hari)
  res.cookie('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari dalam milidetik
  });
}

/**
 * Clear token cookies (untuk logout)
 * @param {Object} res - Express response object
 */
function clearTokenCookies(res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

// -----------------------------------------------------------------------------
// REGISTER CONTROLLER
// -----------------------------------------------------------------------------
const register = async (req, res) => {
  try {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nama, email, password, role } = req.body;

    // Cek email sudah terdaftar atau belum
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate refresh token untuk user baru
    const tempUser = { id: 0, email, role: role || 'user' };
    const refreshToken = generateRefreshToken(tempUser);

    // Hitung expiry time untuk refresh token (7 hari dari sekarang)
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7);

    // Create user dengan refresh token
    const user = await User.create({
      nama,
      email,
      password: hashedPassword,
      role: role || 'user',
      refresh_token: refreshToken,
      refresh_token_expires: refreshTokenExpires
    });

    // Generate access token
    const accessToken = generateAccessToken(user);

    // Re-generate refresh token dengan user.id yang benar
    const finalRefreshToken = generateRefreshToken(user);

    // Update user dengan refresh token final
    await user.update({
      refresh_token: finalRefreshToken
    });

    // Set HttpOnly cookies
    setTokenCookies(res, accessToken, finalRefreshToken);

    // Response (JANGAN kirim token di body untuk security)
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role
        }
        // Token TIDAK dikirim di body, hanya di HttpOnly cookie
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat registrasi'
    });
  }
};

// -----------------------------------------------------------------------------
// LOGIN CONTROLLER
// -----------------------------------------------------------------------------
const login = async (req, res) => {
  try {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Cari user berdasarkan email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Hitung expiry time untuk refresh token
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7);

    // Simpan refresh token ke database
    await user.update({
      refresh_token: refreshToken,
      refresh_token_expires: refreshTokenExpires
    });

    // Set HttpOnly cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Response
    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role
        }
        // Token TIDAK dikirim di body
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login'
    });
  }
};

// -----------------------------------------------------------------------------
// REFRESH TOKEN CONTROLLER - untuk mendapatkan access token baru
// -----------------------------------------------------------------------------
const refreshToken = async (req, res) => {
  try {
    // Ambil refresh token dari cookie
    const refreshTokenFromCookie = req.cookies.refresh_token;

    if (!refreshTokenFromCookie) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token tidak ditemukan. Silakan login kembali.',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshTokenFromCookie,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
      );
    } catch (jwtError) {
      clearTokenCookies(res);

      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token sudah expired. Silakan login kembali.',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Refresh token tidak valid.',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Cari user dan validasi refresh token di database
    const user = await User.findByPk(decoded.id);

    if (!user) {
      clearTokenCookies(res);
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Validasi refresh token sama dengan yang di database
    if (user.refresh_token !== refreshTokenFromCookie) {
      clearTokenCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Refresh token tidak valid. Kemungkinan sudah digunakan.',
        code: 'TOKEN_MISMATCH'
      });
    }

    // Validasi expiry time di database
    if (user.refresh_token_expires && new Date() > user.refresh_token_expires) {
      clearTokenCookies(res);
      await user.update({
        refresh_token: null,
        refresh_token_expires: null
      });

      return res.status(401).json({
        success: false,
        message: 'Refresh token sudah expired. Silakan login kembali.',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    // -------------------------------------------------------------------------
    // REFRESH TOKEN ROTATION (Security Best Practice)
    // -------------------------------------------------------------------------
    // Generate NEW access token DAN NEW refresh token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Hitung expiry time baru
    const newRefreshTokenExpires = new Date();
    newRefreshTokenExpires.setDate(newRefreshTokenExpires.getDate() + 7);

    // Update refresh token di database (rotate)
    await user.update({
      refresh_token: newRefreshToken,
      refresh_token_expires: newRefreshTokenExpires
    });

    // Set cookies baru
    setTokenCookies(res, newAccessToken, newRefreshToken);

    // Response
    res.json({
      success: true,
      message: 'Token berhasil di-refresh',
      data: {
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    clearTokenCookies(res);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat refresh token'
    });
  }
};

// -----------------------------------------------------------------------------
// LOGOUT CONTROLLER - menghapus tokens
// -----------------------------------------------------------------------------
const logout = async (req, res) => {
  try {
    // Jika user authenticated, hapus refresh token dari database
    if (req.user) {
      await User.update(
        {
          refresh_token: null,
          refresh_token_expires: null
        },
        {
          where: { id: req.user.id }
        }
      );
    }

    // Clear cookies
    clearTokenCookies(res);

    res.json({
      success: true,
      message: 'Logout berhasil'
    });
  } catch (error) {
    console.error('Logout error:', error);

    // Tetap clear cookies meskipun ada error
    clearTokenCookies(res);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat logout, tapi cookies sudah dihapus'
    });
  }
};

// -----------------------------------------------------------------------------
// GET PROFILE CONTROLLER
// -----------------------------------------------------------------------------
const getProfile = async (req, res) => {
  try {
    // req.user sudah di-set oleh authMiddleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refresh_token'] }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil'
    });
  }
};

// -----------------------------------------------------------------------------
// VALIDATION RULES
// -----------------------------------------------------------------------------
const registerValidation = [
  body('nama').notEmpty().withMessage('Nama harus diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password harus diisi')
];

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  registerValidation,
  loginValidation
};