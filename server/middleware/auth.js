const jwt = require('jsonwebtoken');
const { User } = require('../models');
const sessionTracker = require('./sessionTracker');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or account deactivated.' });
    }

    req.user = user;
    
    // Defer to session tracker to update lastActiveAt and check timeouts
    return sessionTracker(req, res, next);
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = auth;
