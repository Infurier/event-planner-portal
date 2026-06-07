import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [liveLogs, setLiveLogs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user } = useAuth();

  const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setUnreadMessages(0);
      setLiveLogs([]);
      return;
    }

    API.get('/notifications')
      .then((response) => {
        setUnreadCount(response.data.unreadCount || 0);
      })
      .catch(() => {});

    API.get('/messages/conversations')
      .then((response) => {
        const total = (response.data.conversations || []).reduce(
          (sum, c) => sum + (c.unreadCount || 0), 0
        );
        setUnreadMessages(total);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    const handleNewLog = (log) => {
      if (user.role === 'admin') {
        setLiveLogs((prev) => [log, ...prev].slice(0, 500));
      }
    };

    const handleNotification = (notification) => {
      setUnreadCount((prev) => prev + 1);

      if (notification?.title?.includes('CRITICAL')) {
        toast.error(notification.message, { duration: 5000, icon: '🚨' });
      } else if (notification?.title?.includes('ERROR')) {
        toast.error(notification.message, { duration: 5000 });
      } else if (notification?.title) {
        toast(notification.title, { icon: 'ℹ️' });
      }
    };

    newSocket.on('new-log', handleNewLog);
    newSocket.on('notification', handleNotification);

    setSocket(newSocket);

    return () => {
      newSocket.off('new-log', handleNewLog);
      newSocket.off('notification', handleNotification);
      newSocket.disconnect();
      setSocket((current) => (current === newSocket ? null : current));
    };
  }, [socketUrl, user]);

  const incrementUnreadMessages = useCallback(() => {
    setUnreadMessages((prev) => prev + 1);
  }, []);

  const decrementUnreadMessages = useCallback((count = 1) => {
    setUnreadMessages((prev) => Math.max(0, prev - count));
  }, []);

  const value = {
    socket,
    liveLogs,
    clearLiveLogs: () => setLiveLogs([]),
    unreadCount,
    setUnreadCount,
    unreadMessages,
    setUnreadMessages,
    incrementUnreadMessages,
    decrementUnreadMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
