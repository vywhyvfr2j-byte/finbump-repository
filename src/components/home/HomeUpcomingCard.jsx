import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { daysUntil, formatDate } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';

// How far ahead the card looks, so it stays a glance at what is near and not a
// second calendar page.
const UPCOMING_WINDOW_DAYS = 30;

// Upcoming calendar entries (Events) as one card, grouped by how soon they are:
// today, the rest of this week, then later in the month. Each group is its own
// small block inside the card, so a busy week reads at a glance instead of as
// one long list. Tapping any row opens the calendar.
export default function HomeUpcomingCard({ events }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const groups = useMemo(() => {
    const today = [];
    const week = [];
    const later = [];
    for (const ev of events || []) {
      if (ev.notify === false || !ev.date) continue;
      const days = daysUntil(ev.date);
      if (days < 0 || days > UPCOMING_WINDOW_DAYS) continue;
      const row = { id: ev.id, name: ev.name, date: ev.date, days, type: ev.type };
      if (days === 0) today.push(row);
      else if (days <= 7) week.push(row);
      else later.push(row);
    }
    const soonest = (a, b) => a.days - b.days;
    return [
      { key: 'today', label: t('home.bucketToday'), rows: today.sort(soonest) },
      { key: 'week', label: t('home.bucketWeek'), rows: week.sort(soonest) },
      { key: 'later', label: t('home.bucketLater'), rows: later.sort(soonest) },
    ].filter((group) => group.rows.length > 0);
  }, [events, t]);

  if (groups.length === 0) return null;

  return (
    <div className="px-5 mt-3">
      <section
        className="rounded-2xl border border-border bg-card px-4 py-4 shadow-card"
        aria-labelledby="home-upcoming-heading"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="home-upcoming-heading" className="font-display text-base font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
              <CalendarDays size={16} />
            </span>
            {t('home.comingUp')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            className="inline-flex items-center gap-0.5 min-h-[44px] -my-2.5 text-xs font-medium text-primary"
          >
            {t('nav.calendar')} <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-3 mt-2.5">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">
                {group.label}
              </p>
              <div className="rounded-xl border border-border/70 divide-y divide-border/70 overflow-hidden">
                {group.rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => navigate('/calendar')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/40 transition-colors"
                  >
                    <span className="shrink-0 w-11 text-[11px] font-semibold text-primary">{formatDate(row.date)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium leading-tight truncate">{row.name}</span>
                      {row.type && (
                        <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{row.type}</span>
                      )}
                    </span>
                    {row.days === 0 && (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/25 text-accent-foreground">
                        {t('home.bucketToday')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}