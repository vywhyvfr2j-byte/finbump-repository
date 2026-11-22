import { useEffect, useRef } from 'react';
import { pickDailyContent } from '@/lib/dailyContent';

// Daily encouragement now uses pre-written static content libraries that
// rotate deterministically by day-of-year. No LLM calls, zero integration
// credits consumed. Content is picked once per day and pushed into the store
// so buildNotifications can include it in the in-app notification feed.
//
// Cache: the picked content is persisted in localStorage keyed by day-of-year
// + settings hash so it's available instantly on app open — before the hook
// even runs. This eliminates the first-render flash where content is null.
const CACHE_KEY = 'keepsake_daily_encouragement_v1';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function settingsHash({ faithTradition, scriptureSubject, wantStory, wantMessage, wantScripture, storyCategories }) {
  return [faithTradition, scriptureSubject, wantStory, wantMessage, wantScripture, (storyCategories || []).join(',')].join('|');
}

function loadCached(dayKey, hash) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.dayKey === dayKey && parsed.hash === hash) return parsed.content;
    return null;
  } catch {
    return null;
  }
}

function saveCached(dayKey, hash, content) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ dayKey, hash, content }));
  } catch {
    // ignore quota errors
  }
}

export function useDailyEncouragement({ enabled, faithTradition, scriptureSubject, encouragementStory, encouragementMessage, encouragementScripture, storyCategories, setContent }) {
  const setContentRef = useRef(setContent);
  setContentRef.current = setContent;

  // Normalize toggles — undefined/null defaults to true (backward compatible).
  const wantStory = encouragementStory !== false;
  const wantMessage = encouragementMessage !== false;
  const wantScripture = encouragementScripture !== false;

  useEffect(() => {
    if (!enabled) {
      setContentRef.current(null);
      return;
    }

    // If every item is toggled off, there's nothing to show.
    if (!wantStory && !wantMessage && !wantScripture) {
      setContentRef.current(null);
      return;
    }

    const hash = settingsHash({ faithTradition, scriptureSubject, wantStory, wantMessage, wantScripture, storyCategories });
    const dayKey = todayKey();

    // Try the cache first — instant content on app open.
    const cached = loadCached(dayKey, hash);
    if (cached) {
      setContentRef.current(cached);
      return;
    }

    // Cache miss — pick fresh content and persist it for the rest of the day.
    const content = pickDailyContent({
      faithTradition,
      scriptureSubject,
      wantStory,
      wantMessage,
      wantScripture,
      storyCategories,
    });

    saveCached(dayKey, hash, content);
    setContentRef.current(content);
  }, [enabled, faithTradition, scriptureSubject, wantStory, wantMessage, wantScripture, storyCategories]);
}