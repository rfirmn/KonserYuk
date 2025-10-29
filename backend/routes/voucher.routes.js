const express = require('express');
const router = express.Router();
const {
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucherCode
} = require('../controllers/voucher.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, adminMiddleware, getAllVouchers);
router.get('/:id', authMiddleware, adminMiddleware, getVoucherById);
router.get('/validate/:kode', authMiddleware, validateVoucherCode);
router.post('/', authMiddleware, adminMiddleware, createVoucher);
router.put('/:id', authMiddleware, adminMiddleware, updateVoucher);
router.delete('/:id', authMiddleware, adminMiddleware, deleteVoucher);

module.exports = router;