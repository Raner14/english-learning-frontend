import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    // Connect to the backend WebSocket server, sending userId for identification
    const newSocket = io('http://localhost:3000', {
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
    ];

    notificationEvents.forEach((event) => {
      newSocket.on(event, (data) => {
        setNotifications((prev) => [
          { id: Date.now(), event, data, read: false, createdAt: new Date() },
          ...prev,
        ]);
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
