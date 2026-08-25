const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authCtrl = require('../controllers/authController');

// Rate limiting for auth endpoints - generous window for real-world usage and proxy environments
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: { message: 'Too many authentication attempts. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const auth = require('../middleware/auth');

router.post('/register', authLimiter, authCtrl.register);
router.post('/login', authLimiter, authCtrl.login);
router.put('/profile', auth, authCtrl.updateProfile);

module.exports = router;
