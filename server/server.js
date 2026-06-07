require('dotenv').config();
const express = require('express');
const http = require('http'); 
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const seed = require('./seeders/seed');
const socketManager = require('./utils/socketManager');
const logger = require('./utils/logger');
const { attachRequestId, requestLogger } = require('./middleware/requestLogger');

const app = express();
const server = http.createServer(app); 

socketManager.init(server); 


app.use(cors({
  origin: function(origin, callback) {
    
    if (!origin) return callback(null, true);
    
    if (origin.includes('localhost') || origin.match(/^http:\/\/192\.168\./) || origin.match(/^http:\/\/10\./) || origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\./)) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(attachRequestId);
app.use(requestLogger);


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/logs', require('./routes/logRoutes')); 
app.use('/api/messages', require('./routes/messageRoutes'));


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


app.use((err, req, res, next) => {
  logger.error({
    message: err.message || 'Unhandled Server Error',
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
    statusCode: err.status || 500,
    userId: req.user ? req.user.id : null,
    requestId: req.id
  });
  
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  
  res.status(err.status || 500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    
    await seed();

    server.listen(PORT, '0.0.0.0', () => { 
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      
      const nets = require('os').networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`🌐 LAN access: http://${net.address}:${PORT}`);
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer();
