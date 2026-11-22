import React, { useMemo, useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { actOccurrences } from '@/lib/keepsakeUtils';
import { Heart, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayKey(d) {
  return d.toLocaleDateString('en-CA');
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Projects a recurring cadence (last-done + intervalDays) forward across the
// month range, returning only the future occurrences after today.
function projectScheduled(lastDateStr, cadenceDays, rangeStart, rangeEnd) {
  if (!cadenceDays) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const base = lastDateStr ? new Date(lastDateStr) : today;
  if (isNaN(base.getTime())) return [];
  let cur = new Date(base);
  cur.setHours(0, 0, 0, 0);
  while (cur <= today) {
    cur = new Date(cur.getTime() + cadenceDays * 86400000);
    cur.setHours(0, 0, 0, 0);
  }
  const out = [];
  while (cur <= rangeEnd) {
    if (cur >= rangeStart && cur > today) out.push(new Date(cur));
    cur = new Date(cur.getTime() + cadenceDays * 86400000);
    cur.setHours(0, 0, 0, 0);
  }
  return out;
}

// Date-only comparison: tomorrow and beyond = future, today and before = past.
function isFutureDay(d, todayMid) {
  const dm = new Date(d);
  dm.setHours(0, 0, 0, 0);
  return dm > todayMid;
}

export default function AppreciationCalendarView() {
  const { acts, history, people, personalNotes } = useKeepsake();
  useEnsureEntities(['history', 'personalNotes']);
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const rangeStart = new Date(year, month, 1);
  const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const byDay = useMemo(() => {
    const map = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const add = (date, item) => {
      if (!date || isNaN(date.getTime())) return;
      const key = dayKey(date);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    };

    // --- Acts ---
    // Scheduled (future only): project each act's occurrences across the month.
    acts.forEach((act) => {
      actOccurrences(act, rangeStart, rangeEnd).forEach((d) => {
        if (isFutureDay(d, today)) add(d, { kind: 'act', label: act.name, emoji: act.emoji || '✨', status: 'scheduled' });
      });
    });
    // Completed (past/today): from ActCompletion history.
    (history || []).forEach((h) => {
      const d = new Date(h.completedAt);
      if (!isFutureDay(d, today)) add(d, { kind: 'act', label: h.actName || 'Act', emoji: h.emoji || '✨', status: 'completed' });
    });

    // --- Prayers ---
    people.forEach((p) => {
      if (!p.prayerEnabled || !p.prayerReminderDays) return;
      const name = p.preferredName || p.name;
      // Scheduled (future)
      projectScheduled(p.lastPrayedAt, p.prayerReminderDays, rangeStart, rangeEnd).forEach((d) => {
        add(d, { kind: 'prayer', label: `Pray for ${name}`, emoji: '🤲', status: 'scheduled' });
      });
      // Completed (past) — only the most recent
      if (p.lastPrayedAt) {
        const d = new Date(p.lastPrayedAt);
        if (!isFutureDay(d, today)) add(d, { kind: 'prayer', label: `Prayed for ${name}`, emoji: '🤲', status: 'completed' });
      }
    });

    // --- Care check-ins (health, other, reach-out) ---
    people.forEach((p) => {
      const name = p.preferredName || p.name;
      const careDefs = [
        { lastKey: 'lastHealthCheckIn', daysKey: 'healthReminderDays', label: 'Health check-in', emoji: '🌿' },
        { lastKey: 'lastOtherCheckIn', daysKey: 'otherReminderDays', label: 'Check in', emoji: '💬' },
        { lastKey: 'lastReachedOutAt', daysKey: 'reachOutDays', label: 'Reach out', emoji: '📞' },
      ];
      careDefs.forEach(({ lastKey, daysKey, label, emoji }) => {
        const cadence = p[daysKey];
        if (!cadence) return;
        // Scheduled (future)
        projectScheduled(p[lastKey], cadence, rangeStart, rangeEnd).forEach((d) => {
          add(d, { kind: 'care', label: `${label}: ${name}`, emoji, status: 'scheduled' });
        });
        // Completed (past) — only the most recent
        if (p[lastKey]) {
          const d = new Date(p[lastKey]);
          if (!isFutureDay(d, today)) add(d, { kind: 'care', label: `${label}: ${name}`, emoji, status: 'completed' });
        }
      });
    });

    // --- Appreciation notes (always show) ---
    (personalNotes || []).forEach((n) => {
      if (n.type !== 'appreciation') return;
      const d = new Date(n.createdAt || n.created_date);
      if (isNaN(d.getTime())) return;
      add(d, { kind: 'note', label: n.text, emoji: '💝', status: 'completed' });
    });

    return map;
  }, [acts, history, people, personalNotes, rangeStart, rangeEnd]);

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const monthCount = useMemo(() => {
    return Object.entries(byDay).reduce((sum, [key, items]) => {
      const d = new Date(key);
      if (d.getFullYear() === year && d.getMonth() === month) return sum + items.length;
      return sum;
    }, 0);
  }, [byDay, year, month]);

  const selectedKey = dayKey(selectedDay);
  const selectedItems = byDay[selectedKey] || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="px-5 mb-4">
        <div className="rounded-2xl border border-border bg-card shadow-card px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setMonthDate(new Date(year, month - 1, 1))}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-secondary/60"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="font-display font-semibold text-[15px]">
              {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => setMonthDate(new Date(year, month + 1, 1))}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-secondary/60"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((w, i) => (
              <p key={i} className="text-[10px] font-medium text-muted-foreground">
                {w}
              </p>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const items = byDay[dayKey(day)] || [];
              const count = items.length;
              const isSelected = sameDay(day, selectedDay);
              const isToday = sameDay(day, today);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex flex-col items-center justify-center h-12 rounded-xl mx-auto w-12 transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isToday
                      ? 'bg-secondary'
                      : 'hover:bg-secondary/40'
                  }`}
                >
                  <span className="text-xs font-medium">{day.getDate()}</span>
                  {count > 0 && (
                    <span
                      className={`mt-0.5 flex items-center justify-center min-w-[22px] h-6 px-1 rounded-full text-[9px] font-semibold ${
                        isSelected ? 'bg-primary-foreground text-primary' : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{monthCount} {monthCount === 1 ? 'item' : 'items'} this month</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Clock size={11} /> Scheduled</span>
              <span className="flex items-center gap-1"><Check size={11} /> Done</span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-5">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled or completed for this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 bg-card border rounded-xl px-3.5 py-2.5 ${
                  item.status === 'completed' ? 'border-emerald-200' : 'border-primary/20'
                }`}
              >
                <span className="text-base shrink-0 mt-0.5">{item.emoji}</span>
                <p className="text-sm text-foreground leading-snug flex-1">{item.label}</p>
                {item.status === 'completed' ? (
                  <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <Clock size={14} className="text-primary mt-0.5 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}