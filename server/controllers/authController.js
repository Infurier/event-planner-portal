const jwt = require('jsonwebtoken');
const { User, Vendor, Session, Notification, LoginActivity } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger'); 
const { getIO } = require('../utils/socketManager');
const UAParser = require('ua-parser-js');



const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d' }
  );
};


const parseExpiry = (str) => {
  const val = parseInt(str);
  if (str.endsWith('d')) return val * 86400000;
  if (str.endsWith('h')) return val * 3600000;
  if (str.endsWith('m')) return val * 60000;
  return val * 1000;
};



const parseUserAgent = (req) => {
  const parser = new UAParser(req.headers['user-agent'] || '');
  return {
    browser: parser.getBrowser()?.name || 'Unknown',
    os: parser.getOS()?.name || 'Unknown',
    device: parser.getDevice()?.type || 'desktop'
  };
};

const getIPAddress = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'Unknown';
};



exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, businessName, categoryId } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const user = await User.create({
      name, email, password, phone,
      role: role || 'client'
    });

    if (role === 'vendor' && businessName) {
      await Vendor.create({
        userId: user.id,
        businessName,
        categoryId: categoryId || 1,
        isApproved: false
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    
    const refreshExpiry = parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || '14d');
    await Session.create({
      userId: user.id,
      refreshToken,
      deviceInfo: parseUserAgent(req),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: getIPAddress(req),
      loginAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + refreshExpiry),
      isActive: true
    });

    logger.info({ 
      message: 'New user registered', 
      userId: user.id, 
      metadata: { email, role } 
    });

    res.status(201).json({
      message: 'Registration successful.',
      token: accessToken,
      refreshToken,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    
    
    const logFailure = async (reason, uId = null) => {
      await LoginActivity.create({
        userId: uId, email, status: 'failed', ipAddress: getIPAddress(req),
        deviceInfo: parseUserAgent(req), userAgent: req.headers['user-agent'], reason
      });
      const io = getIO();
      if (io) io.to('admin').emit('failed-login', { email, ip: getIPAddress(req), reason });
    };

    if (!user) {
      logger.warn({ message: 'Login failed: Invalid email', metadata: { email, ip: getIPAddress(req) } });
      await logFailure('invalid email');
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      logger.warn({ message: 'Login failed: Deactivated account', userId: user.id, metadata: { email, ip: getIPAddress(req) } });
      await logFailure('deactivated account', user.id);
      return res.status(403).json({ message: 'Account has been deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn({ message: 'Login failed: Incorrect password', userId: user.id, metadata: { email, ip: getIPAddress(req) } });
      await logFailure('incorrect password', user.id);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    
    const refreshExpiry = parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || '14d');
    let sessionRecord = null;
    try {
      sessionRecord = await Session.create({
        userId: user.id,
        refreshToken,
        deviceInfo: parseUserAgent(req),
        userAgent: req.headers['user-agent'] || '',
        ipAddress: getIPAddress(req),
        loginAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + refreshExpiry),
        isActive: true
      });
    } catch (sessErr) {
      console.error('Session creation warning:', sessErr.message);
    }

    // Success Audit Logging
    await LoginActivity.create({
      userId: user.id, email, status: 'success', ipAddress: getIPAddress(req),
      deviceInfo: parseUserAgent(req), userAgent: req.headers['user-agent'], reason: null
    });

    
    let vendorData = null;
    if (user.role === 'vendor') {
      vendorData = await Vendor.findOne({ where: { userId: user.id } });
    }

    const deviceInfoParsed = parseUserAgent(req);
    logger.info({ 
      message: 'User logged in', 
      userId: user.id, 
      metadata: { email: user.email, role: user.role, ip: getIPAddress(req), device: deviceInfoParsed } 
    });

    const io = getIO();
    if (io && sessionRecord) {
      io.to('admin').emit('new-login', { 
        ...sessionRecord.toJSON(),
        user: { name: user.name, email: user.email, role: user.role }
      });
    }

    res.json({
      message: 'Login successful.',
      token: accessToken,
      refreshToken,
      user: user.toJSON(),
      vendor: vendorData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
};



exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required.' });
    }

    
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token. Please login again.' });
    }

    
    const session = await Session.findOne({
      where: { refreshToken, userId: decoded.id, isActive: true }
    });

    if (!session || new Date() > session.expiresAt) {
      if (session) await session.update({ isActive: false });
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account not found or deactivated.' });
    }

    
    const newAccessToken = generateAccessToken(user);

    res.json({
      token: newAccessToken,
      message: 'Token refreshed.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Token refresh failed.', error: error.message });
  }
};



exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const session = await Session.findOne({ where: { refreshToken } });
      if (session) {
        await session.update({ isActive: false, logoutAt: new Date() });
        const io = getIO();
        if (io) io.to('admin').emit('session-terminated', session.id);
      }
    }

    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed.', error: error.message });
  }
};



exports.logoutAll = async (req, res) => {
  try {
    const sessions = await Session.findAll({ where: { userId: req.user.id, isActive: true } });
    await Session.update(
      { isActive: false, logoutAt: new Date() },
      { where: { userId: req.user.id, isActive: true } }
    );
    
    
    const io = getIO();
    if (io) {
      sessions.forEach(s => io.to('admin').emit('session-terminated', s.id));
    }

    res.json({ message: 'All sessions terminated.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to logout all sessions.', error: error.message });
  }
};



exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.findAll({
      where: { userId: req.user.id, isActive: true, expiresAt: { [Op.gt]: new Date() } },
      attributes: ['id', 'deviceInfo', 'ipAddress', 'loginAt', 'lastActiveAt', 'expiresAt'],
      order: [['loginAt', 'DESC']]
    });
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get sessions.', error: error.message });
  }
};



exports.terminateSession = async (req, res) => {
  try {
    const session = await Session.findOne({
      where: { id: req.params.sessionId, userId: req.user.id, isActive: true }
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    await session.update({ isActive: false, logoutAt: new Date() });
    const io = getIO();
    if (io) io.to('admin').emit('session-terminated', session.id);
    
    res.json({ message: 'Session terminated.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to terminate session.', error: error.message });
  }
};






exports.getMe = async (req, res) => {
  try {
    let vendorData = null;
    if (req.user.role === 'vendor') {
      vendorData = await Vendor.findOne({ where: { userId: req.user.id } });
    }
    res.json({ user: req.user.toJSON(), vendor: vendorData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile.', error: error.message });
  }
};



exports.updateProfile = async (req, res) => {
  try {
    await req.user.update(req.body);
    res.json({ message: 'Profile updated.', user: req.user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
};



exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    req.user.password = newPassword;
    await req.user.save();

    
    const sessions = await Session.findAll({ where: { userId: req.user.id, isActive: true } });
    await Session.update(
      { isActive: false, logoutAt: new Date() },
      { where: { userId: req.user.id, isActive: true } }
    );

    const io = getIO();
    if (io) sessions.forEach(s => io.to('admin').emit('session-terminated', s.id));

    logger.info({ message: 'User changed password', userId: req.user.id });

    res.json({ message: 'Password changed. All sessions have been terminated. Please login again.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password.', error: error.message });
  }
};
