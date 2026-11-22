import { useEffect, useRef } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';

/**
 * Ensures the given entity collections are loaded from the backend.
 * Calls ensureLoaded once on mount — subsequent re-renders are a no-op.
 *
 * @param {string[]} keys - Entity collection keys to load lazily.
 *   Valid keys: movieIdeas, bookIdeas, seriesIdeas, treatIdeas, trips,
 *   history, personalNotes, goals, commLog, favoriteIdeas, personalNeeds,
 *   affiliateLinks
 */
export function useEnsureEntities(keys) {
  const { ensureLoaded } = useKeepsake();
  const keysRef = useRef(keys);
  useEffect(() => {
    ensureLoaded(keysRef.current);
  }, [ensureLoaded]);
}