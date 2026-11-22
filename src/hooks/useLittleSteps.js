import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  LITTLE_STEPS, LITTLE_STEPS_TOTAL, LITTLE_STEPS_SNOOZE_KEY, littleStepsDayNumber, nextLittleStep,
} from '@/lib/littleSteps';

function localDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// The single source of truth for Little Steps on the client: where the user is
// in the series, which lesson is due, and the actions they can take on it.
// Progress is stored per account so it follows them to any device, and no row
// is written until they actually act on a lesson.
export function useLittleSteps() {
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snoozedOn, setSnoozedOn] = useState(() => {
    try {
      return localStorage.getItem(LITTLE_STEPS_SNOOZE_KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    // Newest row first: an older duplicate row must never rewind the series.
    base44.entities.LittleStepsProgress.filter({}, { sort: '-updated_date', limit: 1 })
      .then((page) => {
        if (!cancelled) setRecord((page?.items || [])[0] || null);
      })
      .catch(() => {
        // A read failure only means no saved progress for now; the in-app series
        // still works and the row is written on the next action.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const persist = useCallback(async (patch) => {
    if (!user?.id) return;
    if (record) {
      const updated = await base44.entities.LittleStepsProgress.update(record.id, patch);
      setRecord((r) => ({ ...(r || {}), ...(updated || patch) }));
    } else {
      const created = await base44.entities.LittleStepsProgress.create({ userId: user.id, ...patch });
      setRecord(created || { userId: user.id, ...patch });
    }
  }, [record, user?.id]);

  const completedDays = useMemo(() => record?.completedDays || [], [record]);
  const dayNumber = littleStepsDayNumber(record?.startedAt || user?.created_date);
  const lesson = useMemo(() => nextLittleStep(completedDays, dayNumber), [completedDays, dayNumber]);

  const complete = useCallback((day) => {
    if (completedDays.includes(day)) return;
    persist({ completedDays: [...completedDays, day] });
  }, [completedDays, persist]);

  const snooze = useCallback(() => {
    const today = localDay();
    try {
      localStorage.setItem(LITTLE_STEPS_SNOOZE_KEY, today);
    } catch {
      // With storage unavailable the lesson simply stays for this session.
    }
    setSnoozedOn(today);
  }, []);

  const stop = useCallback(() => persist({ stopped: true }), [persist]);

  const restart = useCallback(() => persist({
    stopped: false,
    completedDays: [],
    startedAt: new Date().toISOString(),
  }), [persist]);

  const setEmailsEnabled = useCallback((enabled) => persist({ emailsEnabled: enabled }), [persist]);

  return {
    loading,
    lesson,
    lessonNumber: lesson ? LITTLE_STEPS.findIndex((l) => l.day === lesson.day) + 1 : LITTLE_STEPS_TOTAL,
    total: LITTLE_STEPS_TOTAL,
    doneCount: completedDays.length,
    finished: completedDays.length >= LITTLE_STEPS_TOTAL,
    stopped: !!record?.stopped,
    emailsEnabled: record?.emailsEnabled !== false,
    snoozed: snoozedOn === localDay(),
    complete,
    snooze,
    stop,
    restart,
    setEmailsEnabled,
  };
}