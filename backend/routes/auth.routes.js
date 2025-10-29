const express = require('express');
const router = express.Router();
const { register, login, getProfile, registerValidation, loginValidation } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;