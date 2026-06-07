const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: function(origin, callback) {
          
          if (!origin) return callback(null, true);
          if (origin.includes('localhost') || origin.match(/^http:\/\/192\.168\./) || origin.match(/^http:\/\/10\./) || origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\./)) {
            return callback(null, true);
          }
          callback(null, true);
        },
        credentials: true
      }
    });

    
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user.id}, Role: ${socket.user.role})`);

      
      socket.join(`user_${socket.user.id}`);

      
      if (socket.user.role === 'admin') {
        socket.join('admin');
        console.log(`👥 Socket ${socket.id} joined admin room`);
      }

      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  
  getIO: () => {
    
    return io; 
  }
};
