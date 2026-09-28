import Icon from './Icons.jsx';
import { timeAgo } from '../utils/helpers.js';

const TYPE_META = {
  match: { icon: 'flame', label: 'Match found' },
  claim: { icon: 'claim', label: 'Claim update' },
  system: { icon: 'info', label: 'System update' },
  info: { icon: 'bell', label: 'Information' }
};

/** Single notification row in the notification centre */
export default function NotificationCard({ notification, onOpen, onMarkRead }) {
  const meta = TYPE_META[notification.type] || TYPE_META.info;
  return (
    <article
      className={`notification-card ${notification.read ? '' : 'notification-card--unread'}`}
      onClick={() => onOpen && onOpen(notification)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <span className={`notification-card__icon type-${notification.type}`}>
        <Icon name={meta.icon} size={18} />
      </span>
      <div className="notification-card__content">
        <p className="notification-card__text">{notification.message}</p>
        <p className="notification-card__meta">
          <span className={`notification-card__tag type-${notification.type}`}>{meta.label}</span>
          <span className="notification-card__time">
            <Icon name="clock" size={12} /> {timeAgo(notification.createdAt)}
          </span>
        </p>
      </div>
      {!notification.read && (
        <button
          type="button"
          className="icon-btn icon-btn--sm"
          aria-label="Mark as read"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead?.(notification.id);
          }}
        >
          <Icon name="check" size={14} />
        </button>
      )}
    </article>
  );
}
