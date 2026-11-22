import React, { useMemo, useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp } from 'lucide-react';
import SupportProgressChart from '@/components/progress/SupportProgressChart';
import ProgressSkeleton from '@/components/progress/ProgressSkeleton';
import GoalsBarChart from '@/components/goals/GoalsBarChart';
import AllProgressSummary from '@/components/progress/AllProgressSummary';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useI18n } from '@/lib/i18n/I18nContext';

const DEFAULT_GOAL = 12;

// The progress view: this month against the goal, acts per month, every other
// tracked area, and the monthly goal editor. Lives here (not in a page) so the
// Progress & History section and any future entry point render the same view.
export default function ProgressPanel() {
  useEnsureEntities(['history', 'goals']);
  const { t } = useI18n();
  const { history, settings, updateSettings, isLoaded } = useKeepsake();
  const goal = settings.monthlySupportGoal && settings.monthlySupportGoal > 0 ? settings.monthlySupportGoal : DEFAULT_GOAL;
  const [draftGoal, setDraftGoal] = useState(String(goal));

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return (history || []).filter((h) => {
      const c = new Date(h.completedAt);
      return c.getFullYear() === now.getFullYear() && c.getMonth() === now.getMonth();
    }).length;
  }, [history]);

  const last6Total = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return (history || []).filter((h) => new Date(h.completedAt) >= start).length;
  }, [history]);

  const saveGoal = () => {
    const n = parseInt(draftGoal, 10);
    if (!Number.isNaN(n) && n > 0) updateSettings({ monthlySupportGoal: n });
    else updateSettings({ monthlySupportGoal: undefined });
  };

  return (
    <div className="px-5 mt-4 space-y-5">
      {!isLoaded ? <ProgressSkeleton /> : <>
        {/* This month summary */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('progress.thisMonth')}</p>
            <p className="font-display text-2xl font-semibold mt-0.5">
              {thisMonthCount} <span className="text-base text-muted-foreground">/ {goal}</span>
            </p>
          </div>
          <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('progress.last6Months')}</p>
            <p className="font-display text-2xl font-semibold mt-0.5">{last6Total}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="font-display text-base font-semibold">{t('progress.actsPerMonth')}</h2>
          </div>
          <SupportProgressChart history={history} goal={goal} />
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <span className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: 'hsl(var(--accent))' }} />
            {t('progress.monthlyGoalLabel', { goal })}
          </p>
        </div>

        {/* Relationship goals progress chart */}
        <GoalsBarChart />

        {/* All progress summary — covers gifts, notes, milestones, events,
            care check-ins, prayer, trips, and connections */}
        <AllProgressSummary />

        {/* Goal editor */}
        <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-primary" />
            <h2 className="font-display text-base font-semibold">{t('progress.monthlyGoalTitle')}</h2>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              value={draftGoal}
              onChange={(e) => setDraftGoal(e.target.value)}
              className="h-11"
            />
            <Button onClick={saveGoal} className="h-11 px-4">
              {t('common.save')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('progress.goalHint')}
          </p>
        </div>
      </>}
    </div>
  );
}