import React from 'react';
import { UserPlus, Activity, Repeat, AlertTriangle } from 'lucide-react';

const TILES = [
  { key: 'signups30', label: 'New accounts', hint: 'last 30 days', Icon: UserPlus },
  { key: 'activeToday', label: 'Active today', hint: 'people who used the app', Icon: Activity },
  { key: 'retention14', label: 'Returning rate', hint: 'last 14 days', Icon: Repeat, suffix: '%' },
  { key: 'pendingCount', label: 'Unfinished checkouts', hint: 'started, never paid', Icon: AlertTriangle },
];

export default function GrowthStats({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TILES.map(({ key, label, hint, Icon, suffix }) => (
        <div key={key} className="rounded-xl border border-border bg-card p-3.5 shadow-card">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
          </div>
          <p className="mt-1.5 font-display text-2xl font-semibold leading-none">
            {stats?.[key] ?? 0}
            {suffix && <span className="text-base font-medium text-muted-foreground">{suffix}</span>}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        </div>
      ))}
    </div>
  );
}