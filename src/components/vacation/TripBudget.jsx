import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const num = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0);
const fmt = (n) => `$${num(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function TripBudget({ trip, onAddCategory, onUpdateCategory, onDeleteCategory, onSetLimit }) {
  const [name, setName] = useState('');
  const [estimated, setEstimated] = useState('');
  const [limit, setLimit] = useState(trip.budgetLimit != null ? String(trip.budgetLimit) : '');

  const categories = Array.isArray(trip.categories) ? trip.categories : [];

  const totalEstimated = categories.reduce((s, c) => s + num(c.estimated ?? c.limit), 0);
  const totalActual = categories.reduce((s, c) => s + num(c.actual), 0);
  const tripLimit = num(trip.budgetLimit);
  const hasLimit = trip.budgetLimit != null && tripLimit > 0;
  const pct = hasLimit ? Math.min(100, Math.round((totalActual / tripLimit) * 100)) : 0;
  const over = hasLimit && totalActual > tripLimit;

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddCategory({ name: name.trim(), estimated: estimated ? Number(estimated) : 0, actual: 0 });
    setName('');
    setEstimated('');
  };

  const handleLimit = (val) => {
    setLimit(val);
    onSetLimit(val === '' ? null : Number(val));
  };

  return (
    <div>
      {/* Spending limit + progress */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Spending limit</span>
          <div className="flex items-center">
            <span className="text-muted-foreground text-sm mr-1">$</span>
            <Input
              type="number"
              value={limit}
              onChange={(e) => handleLimit(e.target.value)}
              placeholder="None"
              className="h-8 w-24 text-right text-sm border-0 px-1 focus-visible:ring-1"
            />
          </div>
        </div>
        {hasLimit ? (
          <>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all ${over ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className={`text-xs font-medium ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
                {fmt(totalActual)} of {fmt(tripLimit)} spent
              </span>
              <span className={`text-xs font-semibold ${over ? 'text-destructive' : 'text-primary'}`}>
                {over ? `Over by ${fmt(totalActual - tripLimit)}` : `${pct}%`}
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Set a limit to track spending at a glance.</p>
        )}
      </div>

      {/* Add category */}
      <div className="flex gap-2 mb-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category (e.g. Flights)" className="h-10 flex-1" />
        <Input
          type="number"
          value={estimated}
          onChange={(e) => setEstimated(e.target.value)}
          placeholder="Est. $"
          className="h-10 w-[88px] shrink-0"
        />
        <Button onClick={handleAdd} disabled={!name.trim()} className="h-10 px-3.5">
          Add
        </Button>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {categories.map((c) => {
          const est = c.estimated ?? c.limit;
          return (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate">{c.name}</span>
                <button onClick={() => onDeleteCategory(c.id)} aria-label="Delete category" className="text-muted-foreground w-11 h-11 flex items-center justify-center">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="text-[10px] uppercase text-muted-foreground font-medium">Estimated</span>
                  <div className="flex items-center mt-0.5">
                    <span className="text-muted-foreground text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={est ?? ''}
                      onChange={(e) => onUpdateCategory(c.id, { estimated: e.target.value === '' ? 0 : Number(e.target.value) })}
                      placeholder="0"
                      className="h-8 border-0 px-1 text-sm focus-visible:ring-1"
                    />
                  </div>
                </label>
                <label className="flex-1">
                  <span className="text-[10px] uppercase text-muted-foreground font-medium">Actual</span>
                  <div className="flex items-center mt-0.5">
                    <span className="text-muted-foreground text-sm mr-1">$</span>
                    <Input
                      type="number"
                      value={c.actual ?? ''}
                      onChange={(e) => onUpdateCategory(c.id, { actual: e.target.value === '' ? 0 : Number(e.target.value) })}
                      placeholder="0"
                      className="h-8 border-0 px-1 text-sm focus-visible:ring-1"
                    />
                  </div>
                </label>
              </div>
            </div>
          );
        })}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No budget items yet.</p>
        )}
      </div>

      {categories.length > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-sm font-medium">Totals</span>
          <span className="text-sm font-semibold text-primary">
            {fmt(totalActual)} <span className="text-muted-foreground font-normal">/ {fmt(totalEstimated)} est.</span>
          </span>
        </div>
      )}
    </div>
  );
}