import React, { useMemo, useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import ScheduleMonthCalendar from '@/components/schedule/ScheduleMonthCalendar';
import { ACT_CATEGORIES } from '@/lib/actTags';

export default function ScheduleCalendar() {
  const { acts, people } = useKeepsake();
  const [activeCats, setActiveCats] = useState(new Set(['act', 'prayer', 'health', 'other']));

  const filteredActs = useMemo(
    () => (acts || []).filter((a) => activeCats.has(a.category || 'act')),
    [acts, activeCats]
  );

  const toggle = (key) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title="Schedule Calendar" subtitle="All contacts" back />

      <div className="px-5 mt-2 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {ACT_CATEGORIES.map((c) => {
            const on = activeCats.has(c.key);
            return (
              <button
                key={c.key}
                onClick={() => toggle(c.key)}
                title={`${on ? 'Hide' : 'Show'} ${c.label}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5">
        <ScheduleMonthCalendar acts={filteredActs} people={people} />
      </div>
    </div>
  );
}