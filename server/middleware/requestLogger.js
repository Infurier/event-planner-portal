const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');


const attachRequestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};


const stream = {
  
  
  write: (message) => {
    
    
    try {
      const data = JSON.parse(message);
      const isSlow = data.responseTimeMs > 500;
      const level = isSlow ? 'warn' : 'info'; 
      
      logger.log({
        level: level,
        message: `HTTP ${data.method} ${data.url} ${data.status} - ${data.responseTimeMs}ms`,
        route: data.url,
        method: data.method,
        statusCode: parseInt(data.status),
        responseTime: parseFloat(data.responseTimeMs),
        requestId: data.requestId,
        userId: data.userId, 
        metadata: {
          ip: data.ip,
          userAgent: data.userAgent
        }
      });
    } catch (e) {
      
      logger.info(message.trim());
    }
  },
};


const morganJsonFormat = (tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTimeMs: tokens['response-time'](req, res),
    requestId: req.id,
    userId: req.user ? req.user.id : null, 
    ip: req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress,
    userAgent: tokens['user-agent'](req, res)
  });
};

const requestLogger = morgan(morganJsonFormat, { stream });

module.exports = {
  attachRequestId,
  requestLogger
};
