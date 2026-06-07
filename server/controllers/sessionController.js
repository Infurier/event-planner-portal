const { Session, LoginActivity, User } = require('../models');
const { Op } = require('sequelize');
const { getIO } = require('../utils/socketManager');


exports.getActiveSessions = async (req, res) => {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    const sessions = await Session.findAll({
      where: {
        isActive: true,
        lastActiveAt: { [Op.gt]: thirtyMinsAgo },
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['lastActiveAt', 'DESC']]
    });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active sessions.' });
  }
};


exports.getInactiveSessions = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    const { count, rows } = await Session.findAndCountAll({
      where: {
        [Op.or]: [
          { isActive: false },
          { lastActiveAt: { [Op.lt]: thirtyMinsAgo } },
          { expiresAt: { [Op.lt]: new Date() } }
        ]
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['logoutAt', 'DESC'], ['lastActiveAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({ 
      sessions: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inactive sessions.' });
  }
};


exports.getLoginLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search, startDate, endDate } = req.query;
    const where = {};

    if (status) where.status = status;
    
    if (search) {
      where.email = { [Op.like]: `%${search}%` };
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(`${startDate}T00:00:00.000Z`), new Date(`${endDate}T23:59:59.999Z`)]
      };
    } else if (startDate) {
      where.createdAt = { [Op.gte]: new Date(`${startDate}T00:00:00.000Z`) };
    } else if (endDate) {
      where.createdAt = { [Op.lte]: new Date(`${endDate}T23:59:59.999Z`) };
    }

    const { count, rows } = await LoginActivity.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      logs: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch login logs.' });
  }
};


exports.terminateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await session.update({ isActive: false, logoutAt: new Date() });

    
    const io = getIO();
    if (io) {
      io.to('admin').emit('session-terminated', session.id);
    }

    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to terminate session.' });
  }
};


exports.terminateUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const sessions = await Session.findAll({ where: { userId, isActive: true } });
    
    await Session.update(
      { isActive: false, logoutAt: new Date() },
      { where: { userId, isActive: true } }
    );

    const io = getIO();
    if (io) {
      sessions.forEach(s => io.to('admin').emit('session-terminated', s.id));
    }

    res.json({ message: `Terminated ${sessions.length} active sessions for user ${userId}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to terminate user sessions.' });
  }
};
