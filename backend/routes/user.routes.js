const express = require('express');
const router = express.Router();
const {
  getUserHistory,
  updateUserProfile
} = require('../controllers/user.controller');
const { authMiddleware } = require('../middlewares/auth');

router.get('/:id/history', authMiddleware, getUserHistory);
router.put('/:id', authMiddleware, updateUserProfile);

module.exports = router;