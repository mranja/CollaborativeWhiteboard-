const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(payload.id || payload.userId);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = { id: user._id, role: user.role, name: user.name };
    next();
  } catch (err) { res.status(401).json({ message: 'Unauthorized' }); }
};
