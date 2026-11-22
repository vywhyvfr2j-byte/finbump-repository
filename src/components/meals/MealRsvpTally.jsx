import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { rsvpCounts } from '@/lib/mealConstants';

// At-a-glance RSVP totals across every gathering still being planned: who has
// accepted, who is unsure, who declined, and who has not answered yet.
export default function MealRsvpTally({ meals = [] }) {
  const { t } = useI18n();

  const totals = (meals || []).reduce(
    (acc, meal) => {
      const counts = rsvpCounts(meal.participants || []);
      acc.coming += counts.yes;
      acc.maybe += counts.maybe;
      acc.declined += counts.no;
      // Anyone without an RSVP answer — including people who answered food and
      // dates before the "can you make it?" question existed.
      acc.waiting += counts.waiting + counts.answered;
      return acc;
    },
    { coming: 0, maybe: 0, declined: 0, waiting: 0 },
  );

  const tiles = [
    { key: 'coming', label: t('meal.coming'), value: totals.coming, highlight: true },
    { key: 'maybe', label: t('meal.rsvpMaybe'), value: totals.maybe },
    { key: 'declined', label: t('meal.notComing'), value: totals.declined },
    { key: 'waiting', label: t('meal.waiting'), value: totals.waiting },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <div key={tile.key}>
          <p
            className={`font-display text-2xl font-semibold leading-none ${
              tile.highlight ? 'text-primary' : ''
            }`}
          >
            {tile.value}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}