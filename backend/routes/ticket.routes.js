const express = require('express');
const router = express.Router();
const { purchaseTicket, validateTicket } = require('../controllers/ticket.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

router.post('/purchase', authMiddleware, purchaseTicket);
router.get('/validate/:qrcode', authMiddleware, adminMiddleware, validateTicket);

module.exports = router;