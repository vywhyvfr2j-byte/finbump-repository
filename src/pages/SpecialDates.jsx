import React, { useMemo, useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { daysUntil, formatDate, nextEventDate } from '@/lib/keepsakeUtils';
import TopNav from '@/components/TopNav';
import { Cake, Heart } from 'lucide-react';

const RELATIONS = [
  { key: 'all', label: 'All' },
  { key: 'partner', label: 'Partner' },
  { key: 'kids', label: 'Kids' },
  { key: 'grandkids', label: 'Grandkids' },
  { key: 'siblings', label: 'Siblings' },
  { key: 'parents', label: 'Parents' },
  { key: 'other', label: 'Other' },
];

export default function SpecialDates() {
  const { events } = useKeepsake();
  const [relationFilter, setRelationFilter] = useState('all');

  const specialDates = useMemo(
    () =>
      [...events]
        .filter((e) => e.type === 'birthday' || e.type === 'anniversary')
        .filter((e) => relationFilter === 'all' || e.relation === relationFilter)
        .sort((a, b) => daysUntil(nextEventDate(a.date, a.type)) - daysUntil(nextEventDate(b.date, b.type))),
    [events, relationFilter]
  );

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title="Special dates" subtitle="Birthdays & Anniversaries" back />

      <div className="px-5 mt-3 flex flex-wrap flex-row-reverse justify-center gap-2">
        {RELATIONS.map((r) => (
          <button
            key={r.key}
            onClick={() => setRelationFilter(r.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              relationFilter === r.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="px-5 mt-3 space-y-2">
        {specialDates.map((event) => {
          const eventDate = nextEventDate(event.date, event.type);
          const days = daysUntil(eventDate);
          const Icon = event.type === 'birthday' ? Cake : Heart;
          return (
            <div key={event.id} className="bg-card rounded-xl border border-border p-2.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl ks-brand-gradient flex items-center justify-center text-primary-foreground shrink-0">
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{event.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(eventDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-base font-semibold text-primary">{days}</p>
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">days to go</p>
              </div>
            </div>
          );
        })}
        {specialDates.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium">No special dates yet</p>
            <p className="text-sm mt-1">Add a birthday or anniversary on the Events page.</p>
          </div>
        )}
      </div>


    </div>
  );
}