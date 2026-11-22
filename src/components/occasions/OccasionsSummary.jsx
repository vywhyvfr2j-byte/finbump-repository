import React from 'react';
import { occasionLabel, occasionWhen } from '@/lib/occasionDisplay';
import { useI18n } from '@/lib/i18n/I18nContext';

// The Month Ahead header: how many occasions fall in the next 30 days and how
// many are still to come this calendar month, plus the very next one.
export default function OccasionsSummary({ occasions }) {
  const { t } = useI18n();
  const now = new Date();
  const next30 = occasions.filter((o) => o.days <= 30).length;
  const thisMonth = occasions.filter(
    (o) => o.date.getFullYear() === now.getFullYear() && o.date.getMonth() === now.getMonth()
  ).length;
  const nearest = occasions[0];
  if (!nearest) return null;

  return (
    <div
      className="rounded-2xl border px-4 py-4 shadow-card ks-card-tint"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-display text-3xl font-semibold leading-none">{next30}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('occasions.next30')}</p>
        </div>
        <div>
          <p className="font-display text-3xl font-semibold leading-none">{thisMonth}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('occasions.thisMonth')}</p>
        </div>
      </div>
      <p className="text-xs text-foreground mt-3 pt-3 border-t border-border/60">
        <span className="font-medium">{t('occasions.nextUp')}:</span> {nearest.name}&rsquo;s{' '}
        {occasionLabel(nearest.occasion, t)} ·{' '}
        {nearest.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (
        {occasionWhen(nearest.days, t)})
      </p>
    </div>
  );
}