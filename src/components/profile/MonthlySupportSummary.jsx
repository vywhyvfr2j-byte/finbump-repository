import React, { useMemo } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import SupportProgressChart from '@/components/progress/SupportProgressChart';

// Summary view shown on the partner profile: how consistently you've been
// completing acts of support for them, month over month.
export default function MonthlySupportSummary() {
  const { history } = useKeepsake();
  // The month-by-month chart IS the completion history — load it here now that
  // it is no longer downloaded on app open.
  useEnsureEntities(['history']);

  const stats = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = (history || []).filter((h) => {
        const c = new Date(h.completedAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      }).length;
      buckets.push(count);
    }
    const thisMonth = buckets[buckets.length - 1];
    const total = buckets.reduce((a, b) => a + b, 0);
    const avg = Math.round((total / buckets.length) * 10) / 10;
    // simple streak: consecutive months (ending this month) with >=1 completion
    let streak = 0;
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (buckets[i] >= 1) streak += 1;
      else break;
    }
    return { thisMonth, avg, streak, total };
  }, [history]);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div>
        <h3 className="font-display text-base font-semibold">Support consistency</h3>
        <p className="text-xs text-muted-foreground">Completed acts of support, by month.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-secondary/60 py-2">
          <p className="text-lg font-semibold leading-none">{stats.thisMonth}</p>
          <p className="text-[10px] text-muted-foreground mt-1">This month</p>
        </div>
        <div className="rounded-xl bg-secondary/60 py-2">
          <p className="text-lg font-semibold leading-none">{stats.avg}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Monthly avg</p>
        </div>
        <div className="rounded-xl bg-secondary/60 py-2">
          <p className="text-lg font-semibold leading-none">{stats.streak}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Month streak</p>
        </div>
      </div>

      <SupportProgressChart history={history} months={6} />

      <p className="text-xs text-muted-foreground leading-relaxed">
        {stats.total === 0
          ? 'No completions logged yet — check off an act of support to start tracking consistency.'
          : stats.thisMonth >= stats.avg
            ? 'Nice — you’re keeping pace or ahead of your recent average.'
            : 'A little quiet this month. One small act can keep the streak going.'}
      </p>
    </div>
  );
}