import React from 'react';
import MemoryMomentItem from '@/components/memory/MemoryMomentItem';
import { useI18n } from '@/lib/i18n/I18nContext';

// One month of the reflection: its name, how many moments it holds, then every
// moment in it — always open, so the year reads as a single scroll.
export default function YearMonthSection({ label, items, onSave, onDelete }) {
  const { t } = useI18n();

  return (
    <section className="mb-2">
      <div className="flex items-baseline justify-between gap-2 pb-1.5 mb-4 border-b border-border/60">
        <h2 className="font-display text-base font-semibold">{label}</h2>
        <span className="text-[11px] text-muted-foreground">
          {items.length === 1 ? t('memorySummary.monthMomentOne') : t('memorySummary.monthMoments', { count: items.length })}
        </span>
      </div>

      <ul className="relative space-y-5 pl-1 mb-6">
        <span className="absolute left-[13px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
        {items.map((entry) => (
          <MemoryMomentItem key={entry.id} entry={entry} onSave={onSave} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  );
}