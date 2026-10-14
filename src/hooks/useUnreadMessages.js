import { useCallback, useEffect, useState } from 'react';
import { conversationsAPI } from '../services/api.js';

/**
 * Lightweight hook to keep track of total unread messages count for badges
 */
export default function useUnreadMessages(userId) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await conversationsAPI.unreadCount();
      if (res.success && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch {
      // Silently catch in background poll
    }
  }, [userId]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 8000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { unreadCount, refresh: fetchCount };
}
