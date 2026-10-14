import { useContext } from 'react';
import { ItemsContext } from '../context/ItemsContext.jsx';

/**
 * Matches store (context-backed, computed by ItemsProvider whenever the
 * item catalogue changes).
 */
export default function useMatches() {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error('useMatches must be used within <ItemsProvider>');
  return { matches: ctx.matches, loading: ctx.loading };
}

// re-exported for call sites that score ad-hoc pairs (report forms, details)
export { computeMatchScore } from '../utils/matchEngine.js';
