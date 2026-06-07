const winston = require('winston');
const Transport = require('winston-transport');
const path = require('path');
const fs = require('fs');


const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}


class DatabaseTransport extends Transport {
  constructor(opts) {
    super(opts);
  }

  async log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      const { Log, Notification, User } = require('../models');
      const socketManager = require('./socketManager');
      
      const { 
        id, level, message, stack, userId, 
        route, method, statusCode, responseTime, 
        requestId, metadata, timestamp
      } = info;

      
      const newLog = await Log.create({
        id, level, message, stack, userId, 
        route, method, statusCode, responseTime, 
        requestId, metadata,
        environment: process.env.NODE_ENV || 'development'
      }).catch(err => console.error('DB Log Error (handled):', err));

      
      const io = socketManager.getIO();
      if (io) {
        
        io.to('admin').emit('new-log', newLog || { 
          id, level, message, stack, userId, route, method, statusCode, responseTime, requestId, metadata, createdAt: new Date()
        });
      }

      
      if (level === 'error' || level === 'critical') {
        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const admin of admins) {
          const notif = await Notification.create({
            userId: admin.id,
            title: `System Alert: ${level.toUpperCase()}`,
            message: message.length > 100 ? message.substring(0, 97) + '...' : message,
            type: 'system_alert'
          }).catch(err => console.error('Notification Log Error (handled):', err));

          
          if (io && notif) {
            io.to(`user_${admin.id}`).emit('notification', notif);
          }
        }
      }

    } catch (error) {
      console.error('Database logger error:', error);
    }
    
    callback();
  }
}


const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', 
  format: customFormat,
  defaultMeta: { service: 'event-planner-service' },
  transports: [
    
    new DatabaseTransport({ level: 'info' }),
    
    new winston.transports.File({ 
      filename: path.join(logDir, 'app.log'), 
      maxsize: 5242880, 
      maxFiles: 5,
    }),
    
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, 
      maxFiles: 5,
    })
  ]
});


if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} ${level}: ${message} ${stack ? '\n' + stack : ''}`;
      })
    )
  }));
}

module.exports = logger;
