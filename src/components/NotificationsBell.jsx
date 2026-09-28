import { Link } from 'react-router-dom';
import Icon from './Icons.jsx';
import useNotifications from '../hooks/useNotifications.js';
import useAuth from '../hooks/useAuth.js';
import { useOutsideClick } from '../hooks/useUi.js';
import { useState } from 'react';
import { timeAgo } from '../utils/helpers.js';

/** Bell icon with unread bubble + dropdown preview (dashboard topbar) */
export default function NotificationsBell({ compact = false }) {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick(() => setOpen(false));

  const recent = notifications.slice(0, 6);

  return (
    <div className={`notif-bell ${compact ? 'notif-bell--compact' : ''}`} ref={ref}>
      <button
        type="button"
        className="topbar-btn"
        aria-label={`Notifications (${unreadCount} unread)`}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 && <span className="notif-bell__bubble">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-bell__pop">
          <header className="notif-bell__head">
            <strong>Notifications</strong>
            <Link to="/notifications" onClick={() => setOpen(false)}>
              View all
            </Link>
          </header>
          <div className="notif-bell__list">
            {recent.length === 0 && <p className="notif-bell__empty">You are all caught up ✨</p>}
            {recent.map((n) => (
              <Link
                to="/notifications"
                key={n.id}
                className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
                onClick={() => {
                  setOpen(false);
                }}
              >
                <span className={`notif-item__ic type-${n.type}`}>
                  <Icon name={n.type === 'match' ? 'flame' : n.type === 'claim' ? 'claim' : 'bell'} size={15} />
                </span>
                <span className="notif-item__body">
                  <span className="notif-item__msg">{n.message}</span>
                  <span className="notif-item__time">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="notif-item__dot" aria-hidden="true" />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
