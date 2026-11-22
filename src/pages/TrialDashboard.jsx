import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TopNav from '@/components/TopNav';
import TrialProgressHeader from '@/components/trial/TrialProgressHeader';
import TodayProgressList from '@/components/trial/TodayProgressList';
import { activeTrialPurchase, trialProgress, planLabel, planPrice } from '@/lib/trialPlans';
import { Crown } from 'lucide-react';

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// The trial, at a glance: days left, where today sits in the week, and the three
// small things that make a day feel kept — a memory moment, an act of care, a
// note. Each is read from what the member actually did today.
export default function TrialDashboard() {
  const [state, setState] = useState({ loading: true, trial: null, counts: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await base44.auth.me();
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const since = startOfToday.toISOString();
      const [purchases, memories, acts, notes] = await Promise.all([
        base44.entities.Base44Purchase.filter({ appUserId: me.id }),
        base44.entities.PersonalNote.count({ type: 'memory', memoryDate: dayKey(now) }),
        base44.entities.ActCompletion.count({ created_by_id: me.id, created_date: { $gte: since } }),
        base44.entities.PersonalNote.count({
          created_by_id: me.id,
          type: { $in: ['appreciation', 'general'] },
          created_date: { $gte: since },
        }),
      ]);
      if (cancelled) return;
      setState({
        loading: false,
        trial: activeTrialPurchase(purchases),
        counts: { memories, acts, notes },
      });
    })().catch(() => {
      if (!cancelled) setState({ loading: false, trial: null, counts: null });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { loading, trial, counts } = state;
  const progress = trialProgress(trial);

  const items = counts
    ? [
        {
          key: 'memory',
          label: 'Capture a memory moment',
          hint: 'One thing from today worth keeping',
          to: '/memory',
          count: counts.memories,
          done: counts.memories > 0,
        },
        {
          key: 'act',
          label: 'Do one act of care',
          hint: 'A small thing for someone you love',
          to: '/acts',
          count: counts.acts,
          done: counts.acts > 0,
        },
        {
          key: 'note',
          label: 'Jot an appreciation note',
          hint: 'What you noticed and loved',
          to: '/appreciation-calendar',
          count: counts.notes,
          done: counts.notes > 0,
        },
      ]
    : [];

  return (
    <div className="min-h-[100dvh] bg-background">
      <TopNav title="Your trial" subtitle="7-day dashboard" backTo="/" />
      <div className="px-4 pt-2 pb-[calc(5.5rem+env(safe-area-inset-bottom))] space-y-4 max-w-2xl mx-auto">
        {loading ? (
          <>
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </>
        ) : !progress ? (
          <div className="rounded-2xl bg-card border border-border p-6 text-center space-y-3">
            <div className="mx-auto flex items-center justify-center w-11 h-11 rounded-full bg-accent/15 text-accent">
              <Crown size={20} />
            </div>
            <div>
              <p className="font-display text-base font-semibold">No trial running right now</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a 7-day free trial on an annual plan and this page shows your days left and
                each day's progress.
              </p>
            </div>
            <Button asChild className="rounded-xl">
              <Link to="/paywall">See plans</Link>
            </Button>
          </div>
        ) : (
          <>
            <TrialProgressHeader
              progress={progress}
              label={planLabel(trial.productId)}
              price={planPrice(trial.productId)}
            />
            <TodayProgressList items={items} />
            <Link
              to="/paywall"
              className="block text-center text-xs text-primary font-medium py-2"
            >
              Pay now or choose a plan
            </Link>
          </>
        )}
      </div>
    </div>
  );
}