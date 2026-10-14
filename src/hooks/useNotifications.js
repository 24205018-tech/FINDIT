import { useCallback, useEffect, useState } from 'react';
import { notificationsAPI } from '../services/api.js';

/** Notification centre — now backed by MongoDB */
export default function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await notificationsAPI.list();
      if (res.success) {
        const normalized = res.data.map(n => ({
          id: n.id,
          userId: n.userId || n.user_id,
          type: n.type,
          message: n.message,
          read: n.read ?? n.isRead ?? !!n.is_read,
          createdAt: n.createdAt || n.created_at,
        }));
        setNotifications(normalized);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      reload(false);
      const timer = setInterval(() => reload(true), 8000);
      const handleRefresh = () => reload(true);
      if (typeof window !== 'undefined') {
        window.addEventListener('notifications:refresh', handleRefresh);
      }
      return () => {
        clearInterval(timer);
        if (typeof window !== 'undefined') {
          window.removeEventListener('notifications:refresh', handleRefresh);
        }
      };
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [reload, userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => (String(n.id) === String(id) ? { ...n, read: true } : n)));
    try {
      await notificationsAPI.markRead(id);
    } catch (e) {
      console.warn('markRead failed', e.message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await notificationsAPI.markAllRead();
    } catch (e) {
      console.warn('markAllRead failed', e.message);
    }
  }, []);

  const addNotification = useCallback(async (type, message, toUserId = userId) => {
    // Optimistic local add
    const temp = {
      id: `N-${Date.now().toString(36)}`,
      userId: toUserId,
      type,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [temp, ...prev]);
    try {
      const res = await notificationsAPI.create({ userId: toUserId, type, message });
      if (res.success && res.data) {
        const n = res.data;
        const normalized = {
          id: n.id,
          userId: n.userId || n.user_id,
          type: n.type,
          message: n.message,
          read: n.read ?? n.isRead ?? !!n.is_read,
          createdAt: n.createdAt || n.created_at,
        };
        setNotifications(prev => [normalized, ...prev.filter(x => String(x.id) !== String(temp.id))]);
        return normalized;
      }
    } catch (e) {
      console.warn('addNotification failed', e.message);
    }
    return temp;
  }, [userId]);

  return { notifications, loading, unreadCount, markRead, markAllRead, addNotification, reload };
}
