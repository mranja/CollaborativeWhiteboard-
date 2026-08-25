const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../utils/jwt');

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Malformed authorization header' });
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.id || payload.userId);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    // normalize id to string to avoid ObjectId vs string comparison bugs
    req.user = { id: user._id.toString(), role: user.role, name: user.name, email: user.email };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ message: 'Unauthorized' });
  }
};
