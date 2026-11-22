import React, { useMemo, useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import TopNav from '@/components/TopNav';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayKey(d) {
  return d.toLocaleDateString('en-CA');
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function AppreciationCalendar() {
  const { t } = useI18n();
  const { personalNotes } = useKeepsake();
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  // Only appreciation notes, keyed by date string -> count + notes list
  const byDay = useMemo(() => {
    const map = {};
    personalNotes.forEach((n) => {
      if (n.type !== 'appreciation') return;
      const d = new Date(n.createdAt || n.created_date);
      if (isNaN(d.getTime())) return;
      const key = dayKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(n);
    });
    return map;
  }, [personalNotes]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const monthNotesCount = useMemo(() => {
    return Object.entries(byDay).reduce((sum, [key, notes]) => {
      const d = new Date(key);
      if (d.getFullYear() === year && d.getMonth() === month) return sum + notes.length;
      return sum;
    }, 0);
  }, [byDay, year, month]);

  const selectedKey = dayKey(selectedDay);
  const selectedNotes = byDay[selectedKey] || [];
  const today = new Date();

  return (
    <div className="min-h-[100dvh] pb-24">
      <TopNav title={t('appreciation.title')} subtitle={t('appreciation.subtitle')} back />

      <div className="px-5 mt-4">
        <div className="rounded-2xl border border-border bg-card shadow-card px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setMonthDate(new Date(year, month - 1, 1))}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-secondary/60"
              aria-label={t('appreciation.previousMonth')}
            >
              <ChevronLeft size={18} />
            </button>
            <p className="font-display font-semibold text-[15px]">
              {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => setMonthDate(new Date(year, month + 1, 1))}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-secondary/60"
              aria-label={t('appreciation.nextMonth')}
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
              const notes = byDay[dayKey(day)] || [];
              const count = notes.length;
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
            <span>{monthNotesCount} {monthNotesCount === 1 ? t('appreciation.noteSingle') : t('appreciation.notePlural')} {t('appreciation.thisMonth')}</span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-primary/15 text-primary text-[8px] font-semibold flex items-center justify-center">N</span>
              {t('appreciation.notesCaptured')}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        {selectedNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('appreciation.noNotes')}</p>
        ) : (
          <div className="space-y-2">
            {selectedNotes.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-2.5 bg-card border border-primary/20 rounded-xl px-3.5 py-2.5"
              >
                <Heart size={14} className="text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground leading-snug">{n.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}