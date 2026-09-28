import { useContext } from 'react';
import { ItemsContext } from '../context/ItemsContext.jsx';

/**
 * Items store (context-backed). Same shape as before — components only
 * call the hook, the provider owns the shared state.
 */
export default function useItems() {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error('useItems must be used within <ItemsProvider>');
  return ctx;
}
