import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { getNotificationText, getNotificationLink } from '../../utils/notificationHelpers';
import './NotificationBell.css';

function NotificationBell() {
  const navigate = useNavigate();
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
              {notifications.slice(0, 20).map((n) => {
                const link = getNotificationLink(n.event, n.data);
                return (
                  <li
                    key={n.id}
                    className={`notif-bell__item${n.read ? '' : ' notif-bell__item--unread'}${link ? ' notif-bell__item--clickable' : ''}`}
                    onClick={link ? () => { setOpen(false); navigate(link); } : undefined}
                  >
                    <p className="notif-bell__text">{getNotificationText(n.event, n.data)}</p>
                    <span className="notif-bell__time">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
