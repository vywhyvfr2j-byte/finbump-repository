import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Loads the member's badges and, on the same call, lets the server award any
// they have earned but never been given (including everything earned before the
// catalog existed). Fire-and-forget on failure: a missing shelf must never
// break the profile page.
export function useBadges() {
  const [state, setState] = useState({ loading: true, earned: {}, progress: {} });

  useEffect(() => {
    let cancelled = false;

    base44.functions
      .invoke('award-badges', {})
      .then(({ data }) => {
        if (cancelled) return;
        const earned = {};
        (data?.earned || []).forEach((row) => {
          if (row?.badgeId) earned[row.badgeId] = row.earnedAt || '';
        });
        setState({ loading: false, earned, progress: data?.progress || {} });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, earned: {}, progress: {} });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}