import React from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import PersonBudgetAlerts from '@/components/gifts/PersonBudgetAlerts';
import { buildNameCount, giftMatchesPerson } from '@/lib/giftMatch';

const OCCASIONS = ['Birthday', 'Christmas', 'Anniversary', 'Other'];
const normalize = (val) => {
  if (!val) return {};
  if (typeof val === 'number') return { Other: val };
  return val;
};
const totalOf = (val) => OCCASIONS.reduce((sum, o) => sum + (Number(normalize(val)[o]) || 0), 0);

// Inline budget view scoped to a single person. Shows spending progress and
// reuses PersonBudgetAlerts for the per-occasion limit editor, so changes
// flow to the same store used by the overall gift tracker.
export default function PersonBudgetInline({ person }) {
  const { giftIdeas, people, personBudgets } = useKeepsake();
  const nameCounts = buildNameCount(people);
  const spent = giftIdeas
    .filter((g) => giftMatchesPerson(g, person, nameCounts) && (g.purchased || g.gifted))
    .reduce((sum, g) => sum + (g.actualCost ?? g.budget ?? 0), 0);
  const limit = totalOf(personBudgets[person.name]);
  const remaining = limit - spent;
  const ratio = limit ? Math.min(1, spent / limit) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{person.name}</span>
          <span className="text-xs text-muted-foreground">{limit ? `$${spent} of $${limit}` : `$${spent} spent`}</span>
        </div>
        {limit > 0 && (
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${ratio >= 1 ? 'bg-destructive' : ratio >= 0.8 ? 'bg-accent' : 'bg-primary'}`}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        )}
        {limit > 0 && (
          <p className={`text-xs mt-1.5 ${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {remaining >= 0 ? `$${remaining} remaining` : `$${Math.abs(remaining)} over budget`}
          </p>
        )}
      </div>

      <PersonBudgetAlerts
        giftIdeas={giftIdeas}
        people={people}
        selectedPersonId={person.id}
        openSignal={1}
      />
    </div>
  );
}