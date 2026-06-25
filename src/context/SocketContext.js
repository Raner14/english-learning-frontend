import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getNotificationText, getNotificationLink } from '../utils/notificationHelpers';

const SocketContext = createContext(null);

/** Manages WebSocket connection, online user tracking, and real-time notifications. */
function SocketProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    // Connect to the backend WebSocket server, sending userId for identification
    const socketUrl = process.env.REACT_APP_API_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      auth: { userId: user.id },
    });

    // When we first connect, the server sends us the full list of online users
    newSocket.on('users:online-list', (userIds) => {
      setOnlineUsers(new Set(userIds.map(String)));
    });

    // A user came online
    newSocket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, String(userId)]));
    });

    // A user went offline
    newSocket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    });

    // Notification events — all follow the same pattern: add to list
    const notificationEvents = [
      'conversation:new-reply',
      'conversation:completed',
      'conversation:reviewed',
      'relation:accepted',
      'relation:requested',
      'relation:removed',
    ];

    notificationEvents.forEach((event) => {
      newSocket.on(event, (data) => {
        setNotifications((prev) => [
          { id: Date.now(), event, data, read: false, createdAt: new Date() },
          ...prev,
        ]);
        toast(getNotificationText(event, data), 'info', getNotificationLink(event, data));
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setOnlineUsers(new Set());
    };
  }, [user?.id]);

  const isUserOnline = useCallback(
    (userId) => onlineUsers.has(String(userId)),
    [onlineUsers]
  );

  const clearNotifications = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, isUserOnline, notifications, unreadCount, clearNotifications }}
    >
      {children}
    </SocketContext.Provider>
  );
}

function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export { SocketProvider, useSocket };
