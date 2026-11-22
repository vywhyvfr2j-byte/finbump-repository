import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, CalendarDays, Utensils, Loader2 } from 'lucide-react';

// The AI's group plan. It reasons only over what each person actually submitted
// — availability windows, food, area, budget and dietary needs — and proposes
// one venue, food type and time, plus backups.
export default function AiMealPlanCard({ meal, answeredCount, onUpdated }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const plan = meal?.aiPlan;

  const generate = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('suggest-meal-plan', { mealId: meal.id });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      onUpdated(data.meal, data.plan);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t('meal.planFailed'));
    } finally {
      setLoading(false);
    }
  };

  const canPlan = answeredCount >= 1;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
          <Sparkles size={17} />
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold text-sm">{t('meal.aiPlan')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('meal.aiPlanDesc')}</p>
        </div>
      </div>

      {plan && (
        <div className="rounded-xl bg-muted/60 p-3.5 mb-3 space-y-2">
          <p className="font-medium">{plan.venueName}</p>
          <div className="text-xs text-muted-foreground space-y-1">
            {plan.venueAddress && (
              <p className="flex items-start gap-1.5">
                <MapPin size={13} className="mt-0.5 shrink-0" /> {plan.venueAddress}
              </p>
            )}
            {plan.dateTime && (
              <p className="flex items-center gap-1.5">
                <CalendarDays size={13} /> {plan.dateTime}
              </p>
            )}
            {plan.cuisine && (
              <p className="flex items-center gap-1.5">
                <Utensils size={13} /> {plan.cuisine}
                {typeof plan.fitScore === 'number' ? ` · ${plan.fitScore}% ${t('meal.fit')}` : ''}
              </p>
            )}
          </div>
          {plan.rationale && (
            <p className="text-xs leading-relaxed">{plan.rationale}</p>
          )}
          {(plan.alternatives || []).length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                {t('meal.backups')}
              </p>
              <ul className="text-xs space-y-1">
                {(plan.alternatives || []).slice(0, 2).map((a) => (
                  <li key={a.venueName}>
                    <span className="font-medium">{a.venueName}</span>
                    {a.cuisine ? ` · ${a.cuisine}` : ''} — {a.why}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      {!canPlan && !plan && (
        <p className="text-sm text-muted-foreground">{t('meal.aiNeedsTwo')}</p>
      )}

      {canPlan && (
        <Button onClick={generate} disabled={loading} variant={plan ? 'outline' : 'default'} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {t('meal.planning')}
            </>
          ) : plan ? (
            t('meal.replan')
          ) : (
            t('meal.askAi')
          )}
        </Button>
      )}
    </div>
  );
}