const express = require('express');
const router = express.Router();
const {
  handleMidtransNotification,
  getAllTransactions
} = require('../controllers/transaction.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

router.post('/notification', handleMidtransNotification);
router.get('/', authMiddleware, adminMiddleware, getAllTransactions);

module.exports = router;