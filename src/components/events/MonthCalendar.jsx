import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, collectOccasions } from '@/lib/keepsakeUtils';
import { getHolidaysForYear } from '@/lib/holidays';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Trip dates are stored as plain YYYY-MM-DD days. Reading one with new Date()
// treats it as UTC midnight, which lands on the day before anywhere west of
// UTC, so date-only values become local days here instead.
function tripDay(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export default function MonthCalendar({ events, milestones, people, pets, profile, trips, meals }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const items = useMemo(() => {
    const viewYear = monthDate.getFullYear();
    const RECURRING = new Set(['birthday', 'anniversary', 'holiday']);
    const list = [];

    // Occasions first (uses preferredName) — processed before events so they
    // win the dedup when both exist for the same person + date.
    collectOccasions(profile, people, pets).forEach((occ) => {
      [viewYear, viewYear + 1].forEach((yr) => {
        const occasionDate = new Date(yr, occ.month, occ.day);
        if (Number.isNaN(occasionDate.getTime())) return;
        list.push({ id: `occ-${occ.id}-${yr}`, date: occasionDate, label: occ.label, type: 'event' });
      });
    });

    events.forEach((e) => {
      const stored = new Date(e.date);
      const date = RECURRING.has(e.type)
        ? new Date(viewYear, stored.getMonth(), stored.getDate())
        : stored;
      list.push({ id: 'e-' + e.id, date, label: e.name, type: 'event' });
    });
    // US holidays — always shown so every month has the standard holidays.
    getHolidaysForYear(viewYear).forEach((h) => {
      list.push({ id: 'hl-' + h.label, date: h.date, label: h.label, type: 'holiday' });
    });
    milestones.forEach((m) => list.push({ id: 'm-' + m.id, date: new Date(m.date), label: m.title, type: 'milestone' }));
    // Trips — mark every day the trip covers, so the whole getaway reads on the
    // month grid instead of only its first and last day.
    (trips || []).forEach((t) => {
      const start = tripDay(t.startDate);
      const end = tripDay(t.endDate);
      if (!start && !end) return;
      const from = start || end;
      const to = end && (!start || end > start) ? end : from;
      const span = Math.max(1, Math.round((to - from) / 86400000) + 1);
      for (let i = 0; i < span; i++) {
        const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
        const isLast = i === span - 1 && span > 1;
        list.push({
          id: `t-${t.id}-${i}`,
          date: day,
          label: isLast ? `Trip ends: ${t.name}` : `Trip: ${t.name}`,
          type: 'trip',
        });
      }
    });
    // Group meals — the agreed date once confirmed, otherwise the floated one.
    (meals || []).forEach((m) => {
      const iso = m.confirmedDate || m.proposedDate;
      if (!iso) return;
      const d = new Date(iso);
      if (!isNaN(d)) list.push({ id: 'ml-' + m.id, date: d, label: `Meal: ${m.title}`, type: 'meal' });
    });

    // Deduplicate by date + person identity. Resolves "Asher's Birthday" and
    // "AJ's Birthday" to the same person when preferredName is set, so only
    // one entry appears per date. Occasions are processed first so they win.
    const allEntities = [...(people || []), ...(pets || [])];
    const resolvePerson = (label) => {
      const stripped = label.replace(/'s (Birthday|Anniversary|Gotcha Day).*$/i, '').trim().toLowerCase();
      if (!stripped) return null;
      let person = allEntities.find((p) =>
        (p.name || '').toLowerCase() === stripped ||
        (p.preferredName || '').toLowerCase() === stripped
      );
      if (person) return person;
      // Prefix match: "asher james vatole" starts with "asher james"
      person = allEntities.find((p) =>
        (p.name && stripped.startsWith(p.name.toLowerCase())) ||
        (p.preferredName && stripped.startsWith(p.preferredName.toLowerCase()))
      );
      return person || null;
    };
    const seen = new Set();
    return list.filter((item) => {
      const person = resolvePerson(item.label);
      const key = person
        ? `${item.date.toDateString()}-${person.id}`
        : `${item.date.toDateString()}-${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [events, milestones, people, pets, profile, trips, meals, monthDate]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const dayItems = (day) => items.filter((it) => sameDay(it.date, day));
  const selectedItems = dayItems(selectedDay);
  const today = new Date();

  const DOT_COLORS = { event: 'bg-primary', holiday: 'bg-amber-400', milestone: 'bg-accent', trip: 'bg-purple-500', meal: 'bg-rose-500' };
  const TYPE_LABELS = { event: 'Event', holiday: 'Holiday', milestone: 'Milestone', trip: 'Trip', meal: 'Meal' };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonthDate(new Date(year, month - 1, 1))}
          aria-label="Previous month"
          className="w-11 h-11 -m-1.5 flex items-center justify-center rounded-full hover:bg-secondary/60"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-display font-semibold text-[15px]">
          {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
        <button
          onClick={() => setMonthDate(new Date(year, month + 1, 1))}
          aria-label="Next month"
          className="w-11 h-11 -m-1.5 flex items-center justify-center rounded-full hover:bg-secondary/60"
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
          const dItems = dayItems(day);
          const isSelected = sameDay(day, selectedDay);
          const isToday = sameDay(day, today);
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center justify-center gap-0.5 h-11 rounded-xl mx-auto w-11 transition-colors ${
                isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-secondary' : ''
              }`}
            >
              <span className="text-xs font-medium">{day.getDate()}</span>
              <div className="flex gap-0.5 h-1.5">
                {dItems.slice(0, 3).map((it) => (
                  <span
                    key={it.id}
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : DOT_COLORS[it.type]}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Event</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Holiday</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Milestone</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Trip</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Meal</span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-muted-foreground mb-2">{formatDate(selectedDay.toISOString())}</p>
        {selectedItems.length === 0 && <p className="text-sm text-muted-foreground">Nothing saved for this day.</p>}
        <div className="space-y-2">
          {selectedItems.map((it) => (
            <div key={it.id} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[it.type]}`} />
              <p className="text-sm font-medium truncate flex-1" title={it.label}>{it.label}</p>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{TYPE_LABELS[it.type] || it.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}