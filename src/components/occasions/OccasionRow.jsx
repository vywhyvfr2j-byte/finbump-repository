import React from 'react';
import { Mail, Gift } from 'lucide-react';
import { occasionDetail, occasionLabel, occasionWhen } from '@/lib/occasionDisplay';
import { showsOnHomeRhythm } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';

// One upcoming occasion: the date on the left, who + what in the middle, and the
// countdown with a send-a-card shortcut on the right. Occasions landing on the
// Home reminder rhythm (18/7/3 days out, then daily through the day) are
// highlighted so the ones that need attention stand out in the list.
export default function OccasionRow({ occasion, onOpenCards, onSendCard, onSendGift }) {
  const { t } = useI18n();
  const label = occasionLabel(occasion.occasion, t);
  const detail = occasionDetail(occasion.occasion, occasion.years, t);
  const who = occasion.relation === 'pet' ? occasion.species || t('nav.pets') : occasion.relation;
  const milestone = showsOnHomeRhythm(occasion.days);

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border px-3 py-3 ${
        milestone ? 'bg-accent/15 border-accent/40' : 'bg-card border-border'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpenCards(occasion)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-xl hover:bg-secondary/50 -mx-1 px-1 py-1"
      >
        <span className="shrink-0 w-11 h-11 rounded-xl border border-border bg-secondary/40 flex flex-col items-center justify-center leading-none">
          <span className="text-sm font-semibold">{occasion.date.getDate()}</span>
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground mt-0.5">
            {occasion.date.toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium leading-tight truncate">
            {occasion.name}&rsquo;s {label}
          </span>
          {[who, detail].filter(Boolean).length > 0 && (
            <span className="block text-xs text-muted-foreground leading-tight mt-0.5 truncate">
              {[who, detail].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>
        <span
          className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            milestone ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {occasionWhen(occasion.days, t)}
        </span>
      </button>
      <div className="shrink-0 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSendCard(occasion)}
          title={t('occasions.sendCardTo', { name: occasion.name })}
          aria-label={t('occasions.sendCardTo', { name: occasion.name })}
          className="flex items-center justify-center w-11 h-11 -m-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
        >
          <Mail size={15} />
        </button>
        <button
          type="button"
          onClick={() => onSendGift(occasion)}
          title={t('occasions.sendGiftTo', { name: occasion.name })}
          aria-label={t('occasions.sendGiftTo', { name: occasion.name })}
          className="flex items-center justify-center w-11 h-11 -m-1.5 rounded-xl border border-accent/50 text-accent-foreground hover:bg-accent/20 transition-colors"
        >
          <Gift size={15} />
        </button>
      </div>
    </div>
  );
}