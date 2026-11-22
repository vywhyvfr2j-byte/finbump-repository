import React from 'react';
import { Check } from 'lucide-react';

// One row in Home's prioritized list. The chip is what makes the order legible:
// the same list mixes what is late, what is due today, the daily habits and what
// is coming this week, so each row says which of those it is.
// Written out in full — Tailwind only keeps class names it can see in the source.
const TIER_CLASS = {
  overdue: 'bg-destructive/10 text-destructive',
  today: 'bg-primary/10 text-primary',
  habit: 'bg-secondary/60 text-foreground',
  week: 'bg-muted text-muted-foreground',
};

const TIER_LABEL = {
  overdue: 'today.overdue',
  today: 'today.dueToday',
  habit: 'today.habit',
  week: 'today.thisWeek',
};

export default function TodayRow({ row, doneNow, t }) {
  const tier = row.tier && TIER_CLASS[row.tier] ? row.tier : 'today';

  return (
    <div className={`rounded-2xl border p-2.5 ${doneNow ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-border bg-card'}`}>
      <div className="flex items-start gap-2.5">
        <span className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-base ${doneNow ? 'bg-emerald-500 text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
          {doneNow ? <Check size={16} strokeWidth={3} /> : row.Icon ? <row.Icon size={16} /> : row.emoji}
        </span>
        <p className="flex-1 min-w-0 pt-1.5 text-sm font-medium leading-snug break-words">{row.title}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
        <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ${TIER_CLASS[tier]}`}>
          {t(TIER_LABEL[tier])}
        </span>
        {row.subtitle && <p className="min-w-0 text-xs text-muted-foreground break-words">{row.subtitle}</p>}
        <button
          onClick={row.onAction}
          title={row.action}
          aria-label={row.action}
          className={`relative ks-hit ml-auto shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium transition-colors ${
            doneNow
              ? 'bg-emerald-600 text-primary-foreground ks-check-pop'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {row.check && <Check size={13} />}
          {doneNow ? t('today.markDone') : row.action}
        </button>
      </div>
    </div>
  );
}