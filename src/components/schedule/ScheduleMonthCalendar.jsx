import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { actOccurrences } from '@/lib/keepsakeUtils';
import { CATEGORY_BY_KEY, ACT_CATEGORIES } from '@/lib/actTags';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function ScheduleMonthCalendar({ acts, people }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const peopleById = useMemo(() => {
    const m = {};
    (people || []).forEach((p) => { m[p.id] = p; });
    return m;
  }, [people]);

  // Project every scheduled item (acts, prayers, health, other) across the
  // visible month so recurring items appear on every cadence date.
  const items = useMemo(() => {
    const viewYear = monthDate.getFullYear();
    const rangeStart = new Date(viewYear, monthDate.getMonth(), 1);
    const rangeEnd = new Date(viewYear, monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const list = [];
    (acts || []).forEach((a) => {
      const cat = a.category || 'act';
      const personName = a.person || peopleById[a.personId]?.name || '';
      actOccurrences(a, rangeStart, rangeEnd).forEach((d, i) => {
        list.push({ id: `${a.id}-${i}`, date: d, act: a, category: cat, personName });
      });
    });
    return list;
  }, [acts, peopleById, monthDate]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const dayItems = (day) => items.filter((it) => sameDay(it.date, day));
  const selectedItems = dayItems(selectedDay);
  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonthDate(new Date(year, month - 1, 1))}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-secondary/60"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => { setMonthDate(new Date()); setSelectedDay(new Date()); }}
          className="font-display font-semibold text-[15px] hover:text-primary"
          title="Jump to today"
        >
          {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </button>
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
          <p key={i} className="text-[10px] font-medium text-muted-foreground">{w}</p>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dItems = dayItems(day);
          const isSelected = sameDay(day, selectedDay);
          const isToday = sameDay(day, today);
          const cats = [...new Set(dItems.map((it) => it.category))].slice(0, 3);
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center justify-center gap-0.5 h-12 rounded-xl mx-auto w-11 transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-secondary' : ''}`}
            >
              <span className="text-xs font-medium">{day.getDate()}</span>
              <div className="flex gap-0.5 h-1.5">
                {cats.map((c) => (
                  <span
                    key={c}
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : (CATEGORY_BY_KEY[c]?.dot || 'bg-slate-400')}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-muted-foreground flex-wrap">
        {ACT_CATEGORIES.map((c) => (
          <span key={c.key} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} /> {c.emoji} {c.label}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {selectedItems.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>}
        <div className="space-y-2">
          {selectedItems.map((it) => {
            const cat = CATEGORY_BY_KEY[it.category] || CATEGORY_BY_KEY.act;
            return (
              <div key={it.id} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
                <span className="text-base shrink-0">{cat?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={it.act.name}>{it.act.name}</p>
                  {it.personName && <p className="text-[11px] text-muted-foreground truncate">{it.personName}</p>}
                </div>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">{cat?.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}