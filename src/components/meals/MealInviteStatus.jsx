import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { rsvpCounts, rsvpStatus } from '@/lib/mealConstants';

// How each answer is highlighted: coming stands out, a no-answer stays quiet.
const BADGE = {
  yes: 'bg-primary/15 text-foreground',
  maybe: 'bg-accent/30 text-foreground',
  no: 'bg-muted text-muted-foreground',
  waiting: 'bg-muted text-muted-foreground',
};

// One gathering's answers, grouped by RSVP so the host can see at a glance who
// accepted, who declined, and who still owes an answer. Used on the meal
// dashboard.
export default function MealInviteStatus({ meal, onChanged }) {
  const { t } = useI18n();
  const { toast } = useToast();
  // { key, coming } of the row being saved, so only that button shows a spinner.
  const [pending, setPending] = useState(null);
  const participants = meal.participants || [];
  const counts = rsvpCounts(participants);

  // Lets the host record an answer on someone's behalf — handy when the reply
  // came by text rather than through the invite link. Only that participant's
  // RSVP is written; everyone else's answers, preferences and private link
  // tokens are preserved.
  const mark = async (participant, coming) => {
    const key = participant.id || participant.email;
    if (pending) return;
    setPending({ key, coming });
    try {
      const next = participants.map((p) =>
        (p.id || p.email) === key
          ? {
              ...p,
              // Keep the original timestamp when they had answered themselves.
              respondedAt: p.respondedAt || new Date().toISOString(),
              response: { ...(p.response || {}), coming },
            }
          : p,
      );
      const saved = await base44.entities.Meal.update(meal.id, { participants: next });
      onChanged?.(saved?.id ? saved : { ...meal, participants: next });
      const name = participant.name || participant.email;
      toast({
        title: coming === 'yes'
          ? t('meal.rsvpUpdatedYes', { name })
          : t('meal.rsvpUpdatedNo', { name }),
      });
    } catch {
      toast({ variant: 'destructive', title: t('meal.rsvpUpdateFailed') });
    } finally {
      setPending(null);
    }
  };

  const rollup = [
    counts.yes ? t('meal.rsvpSummaryComing', { count: counts.yes }) : '',
    counts.maybe ? t('meal.rsvpSummaryMaybe', { count: counts.maybe }) : '',
    counts.no ? t('meal.rsvpSummaryDeclined', { count: counts.no }) : '',
    counts.waiting ? t('meal.rsvpSummaryWaiting', { count: counts.waiting }) : '',
  ]
    .filter(Boolean)
    .join(' · ');

  // 'answered' means they sent food/date preferences before the RSVP question
  // existed, so they belong with the people who have not given an answer.
  const groups = [
    { key: 'yes', label: t('meal.coming'), statuses: ['yes'], people: [] },
    { key: 'maybe', label: t('meal.rsvpMaybe'), statuses: ['maybe'], people: [] },
    { key: 'no', label: t('meal.notComing'), statuses: ['no'], people: [] },
    { key: 'waiting', label: t('meal.waiting'), statuses: ['waiting', 'answered'], people: [] },
  ];

  participants.forEach((p) => {
    const status = rsvpStatus(p);
    const group = groups.find((g) => g.statuses.includes(status));
    if (group) group.people.push(p);
  });

  const filled = groups.filter((g) => g.people.length > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <Link to={`/meals/${meal.id}`} className="font-display font-semibold leading-tight truncate">
          {meal.title}
        </Link>
        <span className="text-xs text-muted-foreground shrink-0">
          {t('meal.peopleCount', { count: participants.length })}
        </span>
      </div>
      {rollup && <p className="text-xs text-muted-foreground mt-1 mb-3">{rollup}</p>}

      <div className={rollup ? 'space-y-3' : 'space-y-3 mt-3'}>
        {filled.map((group) => (
          <div key={group.key}>
            <span
              className={`inline-block text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 ${BADGE[group.statuses[0]]}`}
            >
              {group.label}
            </span>
            <ul className="mt-1.5 space-y-1">
              {group.people.map((p, i) => {
                const key = p.id || p.email || i;
                const status = rsvpStatus(p);
                const saving = pending?.key === key;
                return (
                  <li key={key} className="flex items-center gap-2">
                    <span className="text-sm truncate flex-1">
                      {p.name || p.email}
                      {p.reminderOptOut && (
                        <span className="text-muted-foreground"> · {t('meal.remindersOff')}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'w-11 h-11 rounded-full',
                          status === 'yes' ? 'bg-primary/15 text-primary' : 'text-muted-foreground',
                        )}
                        disabled={saving}
                        onClick={() => mark(p, 'yes')}
                        aria-label={t('meal.markComing')}
                        title={t('meal.markComing')}
                      >
                        {saving && pending.coming === 'yes' ? <Loader2 className="animate-spin" /> : <Check />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'w-11 h-11 rounded-full',
                          status === 'no' ? 'bg-muted text-foreground' : 'text-muted-foreground',
                        )}
                        disabled={saving}
                        onClick={() => mark(p, 'no')}
                        aria-label={t('meal.markNotComing')}
                        title={t('meal.markNotComing')}
                      >
                        {saving && pending.coming === 'no' ? <Loader2 className="animate-spin" /> : <X />}
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}