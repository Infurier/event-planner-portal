import axios from 'axios';
import { logger } from '../services/logger';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};


API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    
    if (error.response && error.response.status !== 401 && error.response.status !== 404) {
      logger.error(`API Error: ${error.response.status} on ${originalRequest.method.toUpperCase()} ${originalRequest.url}`, {
        status: error.response.status,
        data: error.response.data,
        method: originalRequest.method,
        url: originalRequest.url
      }, error);
    } else if (!error.response) {
      
      logger.error(`Network Error on ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {}, error);
    }

    
    if (error.response?.status === 401 && !originalRequest._retry) {

      if (originalRequest.url === '/auth/login') {
        return Promise.reject(error);
      }

      if (originalRequest.url === '/auth/refresh') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('token', data.token);
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
