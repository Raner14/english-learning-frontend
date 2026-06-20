import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import './NotificationBell.css';

function getNotificationText(notification) {
  const { event, data } = notification;
  switch (event) {
    case 'conversation:new-reply':
      return `${data.senderName || 'Someone'} replied to your conversation`;
    case 'conversation:completed':
      return `${data.studentName || 'A student'} completed a conversation (Score: ${data.aiScore})`;
    case 'conversation:reviewed':
      return `${data.teacherName} reviewed your conversation on "${data.lessonTitle}" (Score: ${data.teacherScore})`;
    case 'relation:accepted':
      return `${data.teacherName} accepted your connection request!`;
    default:
      return 'New notification';
  }
}

function NotificationBell() {
  const { notifications, unreadCount, clearNotifications } = useSocket();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggle() {
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) {
      clearNotifications();
    }
  }

  return (
    <div className="notif-bell" ref={dropdownRef}>
      <button type="button" className="notif-bell__btn" onClick={handleToggle} aria-label="Notifications">
        <span className="notif-bell__icon">&#128276;</span>
        {unreadCount > 0 && <span className="notif-bell__badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-bell__dropdown">
          <h4 className="notif-bell__title">Notifications</h4>
          {notifications.length === 0 ? (
            <p className="notif-bell__empty">No notifications yet</p>
          ) : (
            <ul className="notif-bell__list">
              {notifications.slice(0, 20).map((n) => (
                <li key={n.id} className={`notif-bell__item${n.read ? '' : ' notif-bell__item--unread'}`}>
                  <p className="notif-bell__text">{getNotificationText(n)}</p>
                  <span className="notif-bell__time">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
