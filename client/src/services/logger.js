import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class LoggerService {
  constructor() {
    this.logsInQueue = [];
    this.isProcessing = false;
    this.recentErrors = new Set();
  }

  
  async sendLog(level, message, metadata = {}, stack = null, route = window.location.pathname) {
    
    const footprint = `${level}:${message}:${route}`;

    
    if (this.recentErrors.has(footprint)) {
      return;
    }

    this.recentErrors.add(footprint);
    
    setTimeout(() => {
      this.recentErrors.delete(footprint);
    }, 60000);

    const logEntry = { level, message, metadata, stack, route };
    this.logsInQueue.push(logEntry);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.logsInQueue.length === 0) return;

    this.isProcessing = true;

    try {
      
      const client = axios.create({ baseURL: API_URL });

      
      const token = localStorage.getItem('token');
      if (token) {
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      
      const batch = this.logsInQueue.splice(0, 5);

      for (const log of batch) {
        await client.post('/api/logs', log).catch(() => {
          
        });
      }
    } finally {
      this.isProcessing = false;
      
      if (this.logsInQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  error(message, metadata = {}, errorObj = null) {
    let stack = null;
    if (errorObj instanceof Error) {
      stack = errorObj.stack;
      if (!metadata.originalMessage) {
        metadata.originalMessage = errorObj.message;
      }
    }
    this.sendLog('error', message, metadata, stack);
  }

  warn(message, metadata = {}) {
    this.sendLog('warn', message, metadata);
  }

  info(message, metadata = {}) {
    this.sendLog('info', message, metadata);
  }
}

export const logger = new LoggerService();
