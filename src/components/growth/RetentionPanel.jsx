import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const dayLabel = (dateKey) => {
  const [, m, d] = String(dateKey || '').split('-');
  return m && d ? `${Number(m)}/${Number(d)}` : '';
};

export default function RetentionPanel({ daily = [] }) {
  const rows = daily.map((d) => ({
    dateKey: d.dateKey,
    label: dayLabel(d.dateKey),
    returning: d.returning || 0,
    fresh: Math.max((d.active || 0) - (d.returning || 0), 0),
  }));
  const hasActivity = rows.some((r) => r.returning + r.fresh > 0);

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-semibold">Daily activity</h2>
        <span className="text-[11px] text-muted-foreground">last 14 days</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--secondary))' }} />
          Returning
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
          First seen that day
        </span>
      </div>

      {hasActivity ? (
        <div className="mt-3 h-40 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={3} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12, background: 'hsl(var(--popover))' }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              />
              <Bar dataKey="returning" name="Returning" stackId="a" fill="hsl(var(--secondary))" radius={[0, 0, 0, 0]} maxBarSize={18} />
              <Bar dataKey="fresh" name="First seen" stackId="a" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          No activity recorded in the last 14 days yet.
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Returning means the person was already active on an earlier day in the window. Retention is measured from
        in-app activity, the closest thing the app records to a visit.
      </p>
    </section>
  );
}