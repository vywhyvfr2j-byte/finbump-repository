import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';

// Today's small wins, one row each: done ones are ticked, the rest open the page
// where they happen so the day can be finished in a couple of taps.
export default function TodayProgressList({ items }) {
  const done = items.filter((i) => i.done).length;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-base font-semibold">Today</p>
        <p className="text-[11px] text-muted-foreground">
          {done} of {items.length} done
        </p>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className="flex items-center gap-3 rounded-xl px-1 py-2.5 hover:bg-secondary/50 transition-colors"
          >
            {item.done ? (
              <CheckCircle2 size={20} className="shrink-0 text-primary" />
            ) : (
              <Circle size={20} className="shrink-0 text-muted-foreground/50" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm leading-tight ${
                  item.done ? 'text-muted-foreground line-through' : 'font-medium'
                }`}
              >
                {item.label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.hint}</p>
            </div>
            {item.count > 0 && (
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                {item.count} today
              </span>
            )}
            <ChevronRight size={16} className="shrink-0 text-muted-foreground/60" />
          </Link>
        ))}
      </div>
    </div>
  );
}