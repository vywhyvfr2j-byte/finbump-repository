import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

function timing(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

// The quiet block on Month Ahead for the people and pets the user is
// remembering. Same dates, muted styling, and no card or gift prompts — tapping
// a row opens that contact, where their photos and memories live.
export default function RemembranceSection({ remembrances = [] }) {
  const navigate = useNavigate();
  if (remembrances.length === 0) return null;

  return (
    <section aria-labelledby="remembrance-heading" className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="remembrance-heading" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Heart size={12} /> Remembrance
        </h2>
        <span className="text-[11px] text-muted-foreground">Dates you keep</span>
      </div>
      <div className="rounded-2xl border border-border bg-secondary/40 overflow-hidden">
        {remembrances.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => navigate(r.kind === 'pet' ? `/pets?pet=${r.id}` : `/people?person=${r.id}`)}
            className="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/60 last:border-b-0 hover:bg-secondary/60 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
              <Heart size={15} style={{ stroke: 'hsl(var(--primary))' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {timing(r.days)} · {r.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                {r.years ? ` · ${r.years} year${r.years === 1 ? '' : 's'}` : ''}
              </p>
              {r.note && <p className="text-xs text-muted-foreground mt-1">{r.note}</p>}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}