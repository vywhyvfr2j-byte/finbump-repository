import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useToast } from '@/components/ui/use-toast';
import TopNav from '@/components/TopNav';
import PageSkeleton from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import MealResponseGrid from '@/components/meals/MealResponseGrid';
import AiMealPlanCard from '@/components/meals/AiMealPlanCard';
import ConfirmMealForm from '@/components/meals/ConfirmMealForm';
import { formatMealWhen } from '@/lib/mealConstants';
import { Button } from '@/components/ui/button';
import { Copy, CalendarDays, MapPin, Utensils, Trash2, BellRing } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function MealDetail() {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const { confirm, confirmDialog } = useConfirm();

  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.entities.Meal.get(mealId)
      .then((m) => { if (!cancelled) setMeal(m); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mealId]);

  const copyLink = (token) => {
    const url = `${window.location.origin}/meal-invite?m=${encodeURIComponent(meal.id)}&token=${encodeURIComponent(token)}`;
    navigator.clipboard?.writeText(url).then(
      () => toast({ title: t('meal.linkCopied') }),
      () => toast({ title: t('meal.linkCopied'), description: url }),
    );
  };

  const remove = async () => {
    const answer = await confirm({
      title: t('meal.confirmDelete', { title: meal.title }),
      confirmLabel: t('common.remove'),
    });
    if (!answer) return;
    await base44.entities.Meal.delete(meal.id).catch(() => {});
    navigate('/meals');
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto">
        <TopNav title={t('meal.title')} back />
        <PageSkeleton />
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto">
        <TopNav title={t('meal.title')} back />
        <EmptyState icon={Utensils} title={t('meal.notFound')} subtitle={t('meal.notFoundDesc')} />
      </div>
    );
  }

  const participants = meal.participants || [];
  const answered = participants.filter((p) => p.respondedAt).length;
  const confirmed = meal.status === 'confirmed';

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={meal.title} subtitle={t('meal.subtitle')} back />

      <div className="px-5 mt-2 space-y-4">
        {confirmed && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
              {t('meal.statusConfirmed')}
            </p>
            <p className="font-display text-lg font-semibold mb-2">{meal.venueName}</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <CalendarDays size={14} /> {formatMealWhen(meal.confirmedDate)}
              </p>
              {meal.venueAddress && (
                <p className="flex items-center gap-2">
                  <MapPin size={14} /> {meal.venueAddress}
                </p>
              )}
              {meal.cuisine && (
                <p className="flex items-center gap-2">
                  <Utensils size={14} /> {meal.cuisine}
                </p>
              )}
            </div>
          </div>
        )}

        {!confirmed && meal.proposedDate && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CalendarDays size={14} /> {t('meal.hostSuggested', { when: formatMealWhen(meal.proposedDate) })}
          </p>
        )}

        <MealResponseGrid participants={participants} />

        {!confirmed && (
          <>
            <AiMealPlanCard
              meal={meal}
              answeredCount={answered}
              onUpdated={(updated) => setMeal(updated)}
            />
            <ConfirmMealForm meal={meal} onConfirmed={(updated) => setMeal(updated)} />
          </>
        )}

        {meal.menuItems?.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Utensils size={15} /> {t('meal.menuItemsTitle')}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {meal.menuItems.map((item) => (
                <li key={item} className="inline-flex items-center h-8 px-3 rounded-full bg-muted/60 text-xs">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <p className="text-sm font-medium mb-3">
            {t('meal.participants')} ({participants.length})
          </p>
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.token || p.email} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.email}
                    {p.respondedAt ? ` · ${t('meal.answered')}` : ` · ${t('meal.waiting')}`}
                    {p.reminderOptOut ? ` · ${t('meal.remindersOff')}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(p.token)}
                  aria-label={t('meal.copyLinkFor', { name: p.name })}
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-secondary/60 shrink-0"
                >
                  <Copy size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <BellRing size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t('meal.reminders')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('meal.remindersDesc')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('meal.remindersSentCount', { count: meal.remindersSent || 0 })}
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={remove} className="h-11 w-full text-destructive">
          <Trash2 size={16} className="mr-1.5" /> {t('meal.deleteMeal')}
        </Button>
      </div>
      {confirmDialog}
    </div>
  );
}