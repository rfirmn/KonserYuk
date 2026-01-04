// =============================================================================
// AUTH ROUTES - Endpoints untuk autentikasi
// =============================================================================
// Routes ini menangani:
// - Register (POST /api/auth/register)
// - Login (POST /api/auth/login)
// - Refresh Token (POST /api/auth/refresh-token) - NEW!
// - Logout (POST /api/auth/logout) - NEW!
// - Get Profile (GET /api/auth/profile)
// =============================================================================

const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    refreshToken,  // NEW: untuk refresh access token
    logout,        // NEW: untuk logout dan clear cookies
    registerValidation,
    loginValidation
} = require('../controllers/auth.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/auth');

// -------------------------------------------------------------------------
// PUBLIC ROUTES - tidak perlu autentikasi
// -------------------------------------------------------------------------
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// -------------------------------------------------------------------------
// REFRESH TOKEN ROUTE - menggunakan refresh token dari cookie
// -------------------------------------------------------------------------
// Endpoint ini digunakan untuk mendapatkan access token baru
// tanpa perlu login ulang. Frontend harus memanggil endpoint ini
// otomatis saat access token expired (setiap ~15 menit)
router.post('/refresh-token', refreshToken);

// -------------------------------------------------------------------------
// AUTHENTICATED ROUTES - perlu access token dari cookie
// -------------------------------------------------------------------------
router.get('/profile', authMiddleware, getProfile);

// Logout bisa dipanggil dengan atau tanpa auth (clear cookies aja)
router.post('/logout', optionalAuthMiddleware, logout);

module.exports = router;