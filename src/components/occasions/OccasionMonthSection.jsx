import React from 'react';
import OccasionRow from '@/components/occasions/OccasionRow';
import { useI18n } from '@/lib/i18n/I18nContext';

// One month of the Month Ahead dashboard: a month heading with how many
// occasions it holds, then one row per occasion, soonest first.
export default function OccasionMonthSection({ group, onOpenCards, onSendCard, onSendGift }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <p className="font-display text-sm font-semibold">{group.label}</p>
        {group.isCurrentMonth && (
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            {t('occasions.thisMonth')}
          </span>
        )}
        <span className="flex-1 h-px bg-border/60" />
        <span className="text-xs text-muted-foreground">{group.items.length}</span>
      </div>
      <div className="space-y-2">
        {group.items.map((occasion) => (
          <OccasionRow
            key={occasion.key}
            occasion={occasion}
            onOpenCards={onOpenCards}
            onSendCard={onSendCard}
            onSendGift={onSendGift}
          />
        ))}
      </div>
    </div>
  );
}