import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import NotificationCard from '../components/NotificationCard.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useAuth from '../hooks/useAuth.js';
import useNotifications from '../hooks/useNotifications.js';
import { useToast } from '../hooks/useToast.jsx';

const TYPE_TABS = [
  { id: 'all', label: 'All', emoji: '🔔' },
  { id: 'match', label: 'Matches', emoji: '🔥' },
  { id: 'claim', label: 'Claims', emoji: '🛡' },
  { id: 'system', label: 'System', emoji: '⚙️' },
  { id: 'info', label: 'Info', emoji: '💡' }
];

/** Notification centre — read/unread state, filters, mark-all-read. */
export default function Notifications() {
  const { user } = useAuth();
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications(user?.id);
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [openItem, setOpenItem] = useState(null);

  const visible = useMemo(() => {
    let list = notifications;
    if (tab !== 'all') list = list.filter((n) => n.type === tab);
    if (unreadOnly) list = list.filter((n) => !n.read);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [notifications, tab, unreadOnly]);

  const counts = useMemo(() => {
    const c = { all: notifications.length, match: 0, claim: 0, system: 0, info: 0 };
    notifications.forEach((n) => {
      if (c[n.type] !== undefined) c[n.type] += 1;
    });
    return c;
  }, [notifications]);

  const handleMarkAll = () => {
    markAllRead();
    toast.show({ kind: 'success', title: 'All caught up', message: 'Every notification was marked as read.' });
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.` : 'You are all caught up ✨'}
        actions={
          <Button variant="outline" size="sm" icon="check" onClick={handleMarkAll} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        }
      />

      <div className="filter-tabs" role="tablist" aria-label="Filter notifications by type">
        {TYPE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`filter-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.emoji} {t.label}
            <span className="filter-tab__count">{counts[t.id] || 0}</span>
          </button>
        ))}
        <label className="unread-toggle">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
          Unread only
        </label>
      </div>

      {loading ? (
        <div className="page--center"><LoadingSpinner label="Loading notifications…" /></div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="bell"
          title={unreadOnly ? 'No unread notifications' : 'Nothing here yet'}
          message="Match alerts, claim updates and campus news will land here."
        />
      ) : (
        <div className="notification-list">
          {visible.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onOpen={setOpenItem}
              onMarkRead={markRead}
            />
          ))}
        </div>
      )}

      {/* notification detail modal */}
      <Modal open={Boolean(openItem)} onClose={() => setOpenItem(null)} title="Notification" icon="bell" size="sm">
        {openItem && (
          <div className="notice-detail">
            <p>{openItem.message}</p>
            <p className="muted">Received {new Date(openItem.createdAt).toLocaleString('en-IN')}</p>
            {!openItem.read && (
              <Button
                variant="primary"
                size="sm"
                icon="check"
                onClick={() => {
                  markRead(openItem.id);
                  toast.show({ kind: 'success', title: 'Marked as read' });
                  setOpenItem(null);
                }}
              >
                Mark as read
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
