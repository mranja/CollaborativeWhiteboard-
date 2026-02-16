const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authCtrl = require('../controllers/authController');

// Rate limiting for auth endpoints - 5 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many auth attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, authCtrl.register);
router.post('/login', authLimiter, authCtrl.login);

module.exports = router;
