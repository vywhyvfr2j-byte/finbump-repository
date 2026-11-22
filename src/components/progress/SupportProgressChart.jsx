import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

// Shows monthly acts-of-support completions (from the completion log) against a dashed goal line.
export default function SupportProgressChart({ history, goal, months = 6 }) {
  const data = useMemo(() => {
    const now = new Date();
    const arr = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const count = (history || []).filter((h) => {
        const c = new Date(h.completedAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      }).length;
      arr.push({ label, count });
    }
    return arr;
  }, [history, months]);

  const goalVal = goal && goal > 0 ? goal : 0;
  const maxCount = Math.max(0, ...data.map((d) => d.count));

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, Math.max(maxCount, goalVal, 1)]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            width={28}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12, background: 'hsl(var(--popover))' }}
            formatter={(v) => [`${v} completed`, 'Acts']}
          />
          {goalVal > 0 && (
            <ReferenceLine y={goalVal} stroke="hsl(var(--accent))" strokeDasharray="4 4" />
          )}
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={goalVal > 0 && d.count >= goalVal ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}