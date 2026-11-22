import React from 'react';
import { CalendarClock, Crown } from 'lucide-react';
import { TRIAL_DAYS } from '@/lib/trialPlans';

const fmtDate = (d) =>
  d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

// The top of the trial dashboard: how many days are left, where this day sits in
// the seven, and the exact day the card is first charged.
export default function TrialProgressHeader({ progress, label, price }) {
  if (!progress) return null;
  const days = Array.from({ length: TRIAL_DAYS }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/30 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/15 text-accent">
            <Crown size={20} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {label} trial
            </p>
            <p className="font-display text-lg font-semibold leading-tight">
              Day {progress.day} of {TRIAL_DAYS}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold leading-none">{progress.daysLeft}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {progress.daysLeft === 1 ? 'day left' : 'days left'}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-1.5">
          {days.map((d) => {
            const past = d < progress.day;
            const today = d === progress.day;
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full h-2 rounded-full ${
                    past || today ? 'bg-primary' : 'bg-secondary'
                  } ${today ? 'ring-2 ring-primary/30' : ''}`}
                />
                <span
                  className={`text-[10px] ${
                    today ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {d}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-card border border-border p-3">
        <CalendarClock size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground leading-snug">
          Keep your features — your card is charged{price ? ` ${price}` : ''} on{' '}
          {fmtDate(progress.endDate)}. Cancel before then and you pay nothing.
        </p>
      </div>
    </div>
  );
}