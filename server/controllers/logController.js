const { Log, User } = require('../models');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const logger = require('../utils/logger'); 



const recentClientErrors = new Map(); 


exports.getLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      level, 
      startDate, 
      endDate, 
      userId, 
      search 
    } = req.query;

    const where = {};

    
    if (level) where.level = level;
    if (userId) where.userId = userId;
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { [Op.lte]: new Date(endDate) };
    }

    if (search) {
      where[Op.or] = [
        { message: { [Op.like]: `%${search}%` } },
        { route: { [Op.like]: `%${search}%` } },
        { stack: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Log.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        { model: User, as: 'user'  }
      ]
    }).catch(err => {
      
      return Log.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
      });
    });

    res.json({
      logs: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    console.error('getLogs Error:', error);
    res.status(500).json({ message: 'Failed to fetch logs.' });
  }
};


exports.createClientLog = async (req, res) => {
  try {
    const { level = 'error', message, stack, route, metadata } = req.body;
    
    
    if (!message) {
      return res.status(400).json({ message: 'Log message is required.' });
    }

    
    const dedupeKey = `${message}-${route || 'none'}`;
    const now = Date.now();
    
    
    if (recentClientErrors.has(dedupeKey)) {
      const lastLogged = recentClientErrors.get(dedupeKey);
      if (now - lastLogged < 60000) {
        
        return res.status(202).json({ message: 'Log throttled (duplicate)' });
      }
    }
    
    
    recentClientErrors.set(dedupeKey, now);

    
    if (recentClientErrors.size > 1000) {
      recentClientErrors.clear(); 
    }

    const userId = req.user ? req.user.id : null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress;

    
    logger.log({
      level: level,
      message: `[Frontend] ${message}`,
      stack: stack,
      route: route || '/frontend/unknown',
      method: 'CLIENT',
      userId: userId,
      requestId: req.id, 
      metadata: {
        ...metadata,
        clientIp: ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({ message: 'Log recorded successfully' });
  } catch (error) {
    console.error('createClientLog Error:', error);
    res.status(500).json({ message: 'Failed to record log.' });
  }
};


exports.exportLogs = async (req, res) => {
  try {
    const { level, startDate, endDate, search } = req.query;

    const where = {};
    if (level) where.level = level;
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (search) {
      where[Op.or] = [
        { message: { [Op.like]: `%${search}%` } },
        { route: { [Op.like]: `%${search}%` } }
      ];
    }

    const logs = await Log.findAll({
      where,
      order: [['createdAt', 'DESC']],
      
      limit: 10000 
    });

    
    const fields = ['id', 'createdAt', 'level', 'message', 'route', 'method', 'statusCode', 'responseTime', 'userId', 'environment'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(logs.map(l => l.toJSON()));

    res.header('Content-Type', 'text/csv');
    res.attachment(`event_planner_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error('exportLogs Error:', error);
    
    res.status(500).json({ message: 'Failed to export logs.' });
  }
};
