import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { itemsAPI, matchesAPI } from '../services/api.js';
import { buildMatchCatalogue } from '../utils/matchEngine.js';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.jsx';

export const ItemsContext = createContext(null);

/**
 * ItemsProvider — now connected to real backend (MongoDB)
 * - Fetches items from GET /api/items
 * - CRUD via POST/PUT/DELETE /api/items
 * - Matches computed client-side + server-side (GET /api/matches)
 */
export function ItemsProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();

  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // Fetch lost and found in parallel via real API
      const [lostRes, foundRes] = await Promise.all([
        itemsAPI.list({ kind: 'lost', limit: 200 }),
        itemsAPI.list({ kind: 'found', limit: 200 }),
      ]);
      const lost = lostRes.success ? lostRes.data : [];
      const found = foundRes.success ? foundRes.data : [];
      setLostItems(lost);
      setFoundItems(found);
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Failed to load items.');
        toast.show({
          kind: 'error',
          title: 'Load failed',
          message: err.message || 'Could not load items right now.',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    const handleRefresh = () => load(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('items:refresh', handleRefresh);
      window.addEventListener('focus', handleRefresh);
    }
    const interval = setInterval(() => load(true), 10000);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('items:refresh', handleRefresh);
        window.removeEventListener('focus', handleRefresh);
      }
      clearInterval(interval);
    };
  }, [load]);

  // Build matches: try server-side first, fallback to client-side
  useEffect(() => {
    if (loading || (!lostItems.length && !foundItems.length)) return;

    const fetchMatches = async () => {
      try {
        if (user?.id) {
          const res = await matchesAPI.list({ userId: user.id, threshold: 58, limit: 100 });
          if (res.success && res.data && res.data.length > 0) {
            setMatches(res.data);
            return;
          }
        }
        // Fallback to client-side engine
        setMatches(buildMatchCatalogue(lostItems, foundItems, user?.id));
      } catch {
        setMatches(buildMatchCatalogue(lostItems, foundItems, user?.id));
      }
    };

    fetchMatches();
  }, [lostItems, foundItems, user?.id, loading]);

  const addItem = useCallback(async (kind, payload) => {
    // payload from ItemReportForm contains title, category, etc.
    const body = {
      kind,
      title: payload.title,
      category: payload.category,
      description: payload.description,
      colour: payload.colour || payload.color || '—',
      brand: payload.brand || '—',
      location: payload.location,
      date: payload.date,
      time: payload.time || null,
      details: payload.details || '',
      image: payload.image || '',
      imagePreview: payload.imagePreview || payload.image_preview || '',
      status: kind === 'lost' ? 'Active' : 'Reported',
    };
    const res = await itemsAPI.create(body);
    if (res.success && res.data) {
      const item = res.data;
      if (kind === 'lost') setLostItems(prev => [item, ...prev]);
      else setFoundItems(prev => [item, ...prev]);
      return item;
    }
    throw new Error(res.message || 'Failed to create item');
  }, []);

  const updateItem = useCallback(async (id, patch) => {
    const res = await itemsAPI.update(id, patch);
    if (res.success && res.data) {
      const item = res.data;
      const apply = setter => setter(prev => prev.map(it => (String(it.id) === String(id) ? item : it)));
      if (item.kind === 'lost') apply(setLostItems);
      else apply(setFoundItems);
      return item;
    }
    throw new Error(res.message || 'Update failed');
  }, []);

  const deleteItem = useCallback(async (id) => {
    const res = await itemsAPI.delete(id);
    if (res.success) {
      setLostItems(prev => prev.filter(it => String(it.id) !== String(id)));
      setFoundItems(prev => prev.filter(it => String(it.id) !== String(id)));
      return true;
    }
    throw new Error(res.message || 'Delete failed');
  }, []);

  const getItem = useCallback((kind, id) => {
    const pool = kind === 'found' ? foundItems : lostItems;
    const found = pool.find(it => String(it.id) === String(id));
    if (found) return found;
    // Search both pools for legacy URLs
    return [...lostItems, ...foundItems].find(it => String(it.id) === String(id)) || null;
  }, [lostItems, foundItems]);

  const myItems = useCallback((userId) => {
    const uid = userId || user?.id;
    return {
      lost: lostItems.filter(i => String(i.userId) === String(uid) || String(i.user_id) === String(uid)),
      found: foundItems.filter(i => String(i.userId) === String(uid) || String(i.user_id) === String(uid)),
    };
  }, [lostItems, foundItems, user?.id]);

  const value = useMemo(() => ({
    lostItems,
    foundItems,
    allItems: [...lostItems, ...foundItems],
    loading,
    error,
    load,
    addItem,
    updateItem,
    deleteItem,
    getItem,
    myItems,
    matches,
  }), [lostItems, foundItems, loading, error, load, addItem, updateItem, deleteItem, getItem, myItems, matches]);

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}
