import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';

const STORAGE_KEY = 'keepsake_ai_message_usage';
const FREE_LIMIT = 2;
const PAID_LIMIT = 4;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readUsage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[getTodayKey()] || 0;
  } catch {
    return 0;
  }
}

function writeUsage(count) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Prune days older than 7 days to keep storage small.
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    for (const key of Object.keys(data)) {
      if (key < cutoff) delete data[key];
    }
    data[getTodayKey()] = count;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore — storage may be unavailable
  }
}

// Tracks daily AI message generation count in localStorage.
// Free and Basic users: 2/day. Premium members (premium plan, premium lifetime, or admin): 4/day.
export function useAIMessageLimit() {
  const { user } = useAuth();
  const isPremium = user?.role === 'admin' || user?.plan === 'premium' || (!!user?.lifetimeTier && user?.lifetimeTier !== 'lifetime-basic');
  const limit = isPremium ? PAID_LIMIT : FREE_LIMIT;
  const [used, setUsed] = useState(readUsage);

  const increment = useCallback(() => {
    setUsed((prev) => {
      const next = prev + 1;
      writeUsage(next);
      return next;
    });
  }, []);

  const remaining = Math.max(0, limit - used);
  const canGenerate = used < limit;

  return { used, limit, remaining, canGenerate, increment, isPremium };
}