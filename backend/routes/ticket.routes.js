// =============================================================================
// TICKET ROUTES - dengan async queue processing
// =============================================================================
// Routes untuk ticket operations:
// - POST /purchase - Beli tiket (async via queue)
// - GET /purchase-status/:jobId - Cek status pembelian
// - GET /validate/:qrcode - Validasi tiket (admin only)
// - GET /my-tickets - Lihat tiket user
// =============================================================================

const express = require('express');
const router = express.Router();
const {
    purchaseTicket,
    checkPurchaseStatus,
    validateTicket,
    getMyTickets
} = require('../controllers/ticket.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// -------------------------------------------------------------------------
// AUTHENTICATED ROUTES - require user login
// -------------------------------------------------------------------------

// Purchase ticket (add to queue)
router.post('/purchase', authMiddleware, purchaseTicket);

// Check purchase status (polling endpoint)
router.get('/purchase-status/:jobId', authMiddleware, checkPurchaseStatus);

// Get my tickets
router.get('/my-tickets', authMiddleware, getMyTickets);

// -------------------------------------------------------------------------
// ADMIN ROUTES - require admin role
// -------------------------------------------------------------------------

// Validate ticket by QR code (untuk scan saat masuk event)
router.get('/validate/:qrcode', authMiddleware, adminMiddleware, validateTicket);

module.exports = router;