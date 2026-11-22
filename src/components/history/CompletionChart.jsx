import React, { useMemo, useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shortMonthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString(undefined, {
    month: 'short',
  });
}

const BRAND_FILL = 'hsl(var(--primary))';

export default function CompletionChart() {
  const { acts, giftIdeas, people, history } = useKeepsake();
  const [personFilter, setPersonFilter] = useState('all');

  const actPersonMap = useMemo(() => {
    const map = new Map();
    acts.forEach((a) => {
      if (a.id) map.set(a.id, a.personId || '');
    });
    return map;
  }, [acts]);

  // Aggregate completions + gift purchases per month
  const data = useMemo(() => {
    const counts = new Map();
    const bump = (date, personId, type) => {
      if (personFilter !== 'all' && personId !== personFilter) return;
      const key = monthKey(date);
      if (!counts.has(key)) counts.set(key, { key, acts: 0, gifts: 0 });
      const bucket = counts.get(key);
      if (type === 'Act') bucket.acts += 1;
      else bucket.gifts += 1;
    };
    (history?.length ? history : [])
      .filter((h) => h.completedAt)
      .forEach((h) => bump(h.completedAt, actPersonMap.get(h.actId) || '', 'Act'));
    giftIdeas
      .filter((g) => g.purchased && g.purchasedAt)
      .forEach((g) => bump(g.purchasedAt, g.personId || '', 'Gift'));
    return [...counts.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((b) => ({
        ...b,
        month: shortMonthLabel(b.key),
        total: b.acts + b.gifts,
      }));
  }, [history, acts, giftIdeas, actPersonMap, personFilter]);

  const totals = useMemo(
    () => ({
      acts: data.reduce((s, d) => s + d.acts, 0),
      gifts: data.reduce((s, d) => s + d.gifts, 0),
      months: data.length,
    }),
    [data]
  );

  const peopleOptions = sortPeopleForPicker(people);

  return (
    <div>
      {/* Person filter */}
      <div className="mb-3">
        <Select value={personFilter} onValueChange={setPersonFilter}>
          <SelectTrigger className="h-10 rounded-xl bg-card">
            <SelectValue placeholder="All people" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All people</SelectItem>
            {peopleOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-semibold font-display text-foreground">{totals.acts}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">Acts</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-semibold font-display text-foreground">{totals.gifts}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">Gifts</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-semibold font-display text-foreground">{totals.months}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">Months</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp size={28} className="mx-auto mb-2 opacity-40" />
          <p className="font-medium">No data yet</p>
          <p className="text-sm mt-1">
            Complete a few acts or gifts to see your progress charted here.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Support over time</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                />
                <Bar dataKey="acts" name="Acts" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={BRAND_FILL} />
                  ))}
                </Bar>
                <Bar dataKey="gifts" name="Gifts" radius={[4, 4, 0, 0]} maxBarSize={36} fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: BRAND_FILL }} />
              Acts
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent" />
              Gifts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}