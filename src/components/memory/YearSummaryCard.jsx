import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';

// The stretch of time at a glance: how many moments were kept (and how many
// pictures went with them), and a twelve-segment strip showing which months
// they came from.
export default function YearSummaryCard({ total, photoCount = 0, monthsCovered, windowLabel }) {
  const { t } = useI18n();
  const filled = new Set(monthsCovered);

  return (
    <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-4 shadow-card">
      {windowLabel && (
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{windowLabel}</p>
      )}
      <p className="font-display text-2xl font-semibold leading-tight">
        {total === 1 ? t('memorySummary.momentsCountOne') : t('memorySummary.momentsCount', { count: total })}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {t('memorySummary.acrossMonths', { months: monthsCovered.length })}
        {photoCount > 0 && (
          <>
            {' · '}
            {photoCount === 1
              ? t('memorySummary.photosCountOne')
              : t('memorySummary.photosCount', { count: photoCount })}
          </>
        )}
      </p>
      <div className="flex items-end gap-1 mt-3" aria-hidden="true">
        {Array.from({ length: 12 }, (_, m) => (
          <span
            key={m}
            className={`flex-1 rounded-full ${filled.has(m) ? 'h-5 bg-primary/70' : 'h-2 bg-border'}`}
          />
        ))}
      </div>
    </div>
  );
}