import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Calendar boundaries in the user's LOCAL time — the counters reset at local
// midnight, Monday morning, the 1st of the month, and Jan 1. The server cannot
// infer the user's timezone, so the boundaries are computed here and sent along.
export function completionBoundaries(now = new Date()) {
  const todayStartMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dow = now.getDay(); // 0 = Sun … 6 = Sat
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  return {
    todayStart: new Date(todayStartMs).toISOString(),
    weekStart: new Date(todayStartMs - daysSinceMonday * 86400000).toISOString(),
    monthStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    yearStart: new Date(now.getFullYear(), 0, 1).toISOString(),
  };
}

/**
 * Today / this week / this month / this year completion counts, counted on the
 * server so the app no longer downloads the completion history to add it up.
 *
 * `revision` re-runs the count — Home passes the length of the in-memory history
 * so the numbers move the moment an act is checked off, without a reload.
 *
 * Returns null until the first answer arrives, so callers can keep the block
 * hidden rather than flashing four zeros.
 */
export function useCompletionStats(revision = 0) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('get-completion-stats', completionBoundaries())
      .then((res) => {
        if (!cancelled && res?.data) setStats(res.data);
      })
      .catch(() => {
        // Counts are decorative: a failure leaves the block hidden.
      });
    return () => {
      cancelled = true;
    };
  }, [revision]);

  return stats;
}