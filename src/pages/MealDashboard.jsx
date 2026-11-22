import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import TopNav from '@/components/TopNav';
import MealCard from '@/components/meals/MealCard';
import MealInviteStatus from '@/components/meals/MealInviteStatus';
import MealRsvpTally from '@/components/meals/MealRsvpTally';
import EmptyState from '@/components/EmptyState';
import PageSkeleton from '@/components/PageSkeleton';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { Utensils } from 'lucide-react';

// Gatherings that are still being planned or are locked in.
const UPCOMING_STATUSES = ['proposed', 'confirmed'];

function mealDate(meal) {
  const iso = meal.confirmedDate || meal.proposedDate;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function MealDashboard() {
  useFeatureTracking('meals');
  const { t } = useI18n();
  const [meals, setMeals] = useState(null);

  useEffect(() => {
    let cancelled = false;
    base44.entities.Meal.list('-created_date')
      .then((rows) => { if (!cancelled) setMeals(rows || []); })
      .catch(() => { if (!cancelled) setMeals([]); });
    return () => { cancelled = true; };
  }, []);

  // A host marking someone's RSVP from the list replaces that meal in place, so
  // the tallies and stat tiles above refresh without a reload.
  const handleMealChanged = (updated) => {
    setMeals((prev) => (prev || []).map((m) => (m.id === updated.id ? updated : m)));
  };

  const { upcoming, stats } = useMemo(() => {
    const up = (meals || []).filter((m) => UPCOMING_STATUSES.includes(m.status || 'proposed'));
    // Soonest first; gatherings without a date yet sink to the bottom.
    up.sort((a, b) => {
      const da = mealDate(a);
      const db = mealDate(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });
    const participants = up.flatMap((m) => m.participants || []);
    return {
      upcoming: up,
      stats: {
        planned: up.length,
        confirmed: up.filter((m) => m.status === 'confirmed').length,
        waiting: participants.filter((p) => !p.respondedAt).length,
        invites: participants.length,
      },
    };
  }, [meals]);

  if (meals === null) {
    return (
      <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto">
        <TopNav title={t('meal.dashboard')} subtitle={t('meal.dashboardSubtitle')} backTo="/meals" />
        <PageSkeleton />
      </div>
    );
  }

  const tiles = [
    { label: t('meal.statPlanned'), value: stats.planned },
    { label: t('meal.statConfirmed'), value: stats.confirmed },
    { label: t('meal.statWaiting'), value: stats.waiting },
    { label: t('meal.statInvites'), value: stats.invites },
  ];

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('meal.dashboard')} subtitle={t('meal.dashboardSubtitle')} backTo="/meals" />

      <div className="px-5 mt-2 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
              <p className="font-display text-2xl font-semibold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title={t('meal.noUpcoming')}
            subtitle={t('meal.noUpcomingDesc')}
          />
        ) : (
          <>
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('meal.upcoming')}
              </p>
              {upcoming.map((m) => <MealCard key={m.id} meal={m} />)}
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('meal.inviteStatus')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t('meal.inviteStatusDesc')}</p>
              </div>
              <MealRsvpTally meals={upcoming} />
              {upcoming.map((m) => (
                <MealInviteStatus key={m.id} meal={m} onChanged={handleMealChanged} />
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}