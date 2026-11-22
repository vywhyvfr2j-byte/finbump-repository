import { useEffect, useCallback, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isQuietHoursNow } from '@/lib/quietHours';
import { requestNotificationPermission } from '@/lib/notificationPermission';
import { buildNotifications } from '@/lib/buildNotifications';
import {
  LITTLE_STEPS, LITTLE_STEPS_TOTAL, littleStepsDayNumber, nextLittleStep, littleStepsSnoozedToday,
} from '@/lib/littleSteps';

const NOTIFIED_KEY = 'keepsake_notified_v1';

function getNotifiedToday() {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');
    return raw.day === new Date().toDateString() ? raw.ids : [];
  } catch {
    return [];
  }
}

function markNotifiedToday(ids) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify({ day: new Date().toDateString(), ids }));
}

// Unified notification engine: builds the current notification set from the
// user's data (respecting global toggles + per-item/per-person `notify` flags),
// pushes it into the in-app feed, and fires a browser notification once per
// item per day for anything new. Replaces the three legacy browser-only hooks.
export function useInAppNotifications({ acts, events, milestones, giftIdeas, people, pets, profile, settings, dailyEncouragementContent, memoryRefreshes, personalNotes, myPreferences, adminInsights, setNotificationFeed }) {
  const { user } = useAuth();
  const [littleStep, setLittleStep] = useState(null);

  // The Little Steps lesson that is due, read once per app open. The lesson
  // emails are paused, so the reminder in the feed is how the series reaches
  // the user now; a lesson they snoozed or stopped is left alone.
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setLittleStep(null);
      return undefined;
    }
    // Newest row first, so the reminder names the lesson that is really next.
    base44.entities.LittleStepsProgress.filter({}, { sort: '-updated_date', limit: 1 })
      .then((page) => {
        if (cancelled) return;
        const row = (page?.items || [])[0] || null;
        if (row?.stopped || littleStepsSnoozedToday()) {
          setLittleStep(null);
          return;
        }
        const lesson = nextLittleStep(row?.completedDays || [], littleStepsDayNumber(row?.startedAt || user.created_date));
        if (!lesson) {
          setLittleStep(null);
          return;
        }
        setLittleStep({
          day: lesson.day,
          title: lesson.title,
          body: lesson.body,
          route: lesson.route,
          number: LITTLE_STEPS.findIndex((l) => l.day === lesson.day) + 1,
          total: LITTLE_STEPS_TOTAL,
        });
      })
      .catch(() => {
        // A read failure only means no lesson reminder this session.
        if (!cancelled) setLittleStep(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.created_date]);

  // Rebuild the feed from current data. Extracted so both the data-change
  // effect and the visibilitychange listener can call it without duplicating
  // the buildNotifications call.
  const rebuild = useCallback(() => {
    const fresh = buildNotifications({ acts, events, milestones, giftIdeas, people, pets, profile, settings, dailyEncouragementContent, memoryRefreshes, personalNotes, myPreferences, adminInsights, littleStep });
    setNotificationFeed(fresh);
    return fresh;
  }, [acts, events, milestones, giftIdeas, people, pets, profile, settings, dailyEncouragementContent, memoryRefreshes, personalNotes, myPreferences, adminInsights, littleStep, setNotificationFeed]);

  // Build the feed and fire browser notifications for new items (once per day).
  useEffect(() => {
    const fresh = rebuild();
    if (fresh.length === 0) return;
    const already = getNotifiedToday();
    const toFire = fresh.filter((n) => !already.includes(n.id));
    if (toFire.length === 0) return;
    // Quiet hours: hold the nudge rather than firing it now. Nothing is marked as
    // notified, so it goes out on the next visit after the window closes.
    if (isQuietHoursNow()) return;

    if ('Notification' in window) {
      const send = () => toFire.forEach((n) => new Notification(n.title, { body: n.body }));
      if (Notification.permission === 'granted') {
        send();
      } else if (Notification.permission !== 'denied') {
        requestNotificationPermission().then((p) => p === 'granted' && send());
      }
    }
    markNotifiedToday([...already, ...toFire.map((n) => n.id)]);
  }, [rebuild]);

  // Day-rollover cleanup: rebuild the feed when the app becomes visible so
  // read notifications from the previous day are dropped (the kept filter in
  // setNotificationFeed removes them when clickedDay < todayKey). Without
  // this, read notifications would persist across days if no data changed
  // to trigger the main effect.
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') rebuild();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [rebuild]);
}