import React, { useState, useMemo } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n/I18nContext';

// Overall goals bar graph showing goals completed per month for the past 6
// months. A filter dropdown lets the user choose "all" or any individual
// connection (including partner/spouse, who is a Person in the people list).
export default function GoalsBarChart() {
  useEnsureEntities(['goals']);
  const { t } = useI18n();
  const { goals, people } = useKeepsake();
  const [filter, setFilter] = useState('all');

  const connections = useMemo(
    () => people.map((p) => ({ id: p.id, name: p.preferredName || p.name || t('goals.unknown') })),
    [people]
  );

  const filteredGoals = useMemo(() => {
    if (filter === 'all') return goals;
    return goals.filter((g) => (g.personId || '') === filter);
  }, [goals, filter]);

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString(undefined, { month: 'short' }),
        count: 0,
      });
    }
    for (const g of filteredGoals) {
      if (!g.done) continue;
      const dateStr = g.completedAt || g.updated_date || g.created_date;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = months.find((mo) => mo.key === key);
      if (m) m.count++;
    }
    return months;
  }, [filteredGoals]);

  const totalCompleted = chartData.reduce((s, m) => s + m.count, 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">{t('goals.completed')}</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs" aria-label={t('goals.filterAria')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('goals.allConnections')}</SelectItem>
            {connections.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-xs text-muted-foreground">
        {totalCompleted === 1 ? t('goals.completedSingle', { count: totalCompleted }) : t('goals.completedPlural', { count: totalCompleted })}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}