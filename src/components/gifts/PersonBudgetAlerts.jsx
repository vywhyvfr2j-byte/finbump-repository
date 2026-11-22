import React, { useState, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { buildNameCount, giftMatchesPerson } from '@/lib/giftMatch';

const OCCASIONS = ['Birthday', 'Christmas', 'Anniversary', 'Other'];

// Budgets may be a legacy single number, an object keyed by occasion, or empty.
const normalize = (val) => {
  if (!val) return {};
  if (typeof val === 'number') return { Other: val };
  return val;
};
const totalOf = (val) =>
  OCCASIONS.reduce((sum, o) => sum + (Number(normalize(val)[o]) || 0), 0);

export default function PersonBudgetAlerts({ giftIdeas, people: peopleList, onSelectPerson, selectedPersonId, openSignal = 0 }) {
  const { personBudgets, setPersonBudget } = useKeepsake();
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState({});

  // Auto-open the budget editor when triggered externally (e.g. tapping a
  // spending-summary row on the gift tracker page).
  useEffect(() => {
    if (openSignal > 0) setEditing(true);
  }, [openSignal, selectedPersonId]);

  const sortedPeople = sortPeopleForPicker(peopleList || []);
  if (sortedPeople.length === 0) return null;

  const selectedPerson = (peopleList || []).find((p) => p.id === selectedPersonId) || null;
  const selectedName = selectedPerson?.name || '';
  if (!selectedPerson) return null;

  const nameCounts = buildNameCount(peopleList || []);
  const personGifts = giftIdeas.filter((g) => giftMatchesPerson(g, selectedPerson, nameCounts));
  const spentForSelected = personGifts
    .filter((g) => g.purchased || g.gifted)
    .reduce((sum, g) => sum + (g.actualCost ?? g.budget ?? 0), 0);

  // Per-occasion breakdown of budgeted vs. spent — the occasion is the budget
  // "category". Gifts with no occasion roll up under "Other" so every dollar is
  // accounted for.
  const occasionSpent = {};
  OCCASIONS.forEach((o) => (occasionSpent[o] = 0));
  personGifts.forEach((g) => {
    if (!(g.purchased || g.gifted)) return;
    const occ = OCCASIONS.includes(g.occasion) ? g.occasion : 'Other';
    occasionSpent[occ] += g.actualCost ?? g.budget ?? 0;
  });
  const occasionBudget = normalize(personBudgets[selectedName]);

  const limit = totalOf(personBudgets[selectedName]);
  const ratio = limit ? spentForSelected / limit : 0;
  const warnings = limit && ratio >= 0.8 ? [{ person: selectedName, spent: spentForSelected, limit, over: ratio >= 1 }] : [];

  const startEditing = () => {
    setDrafts((d) => ({
      ...d,
      [selectedName]: { ...normalize(personBudgets[selectedName]) },
    }));
    setEditing(true);
  };

  const updateDraft = (occasion, value) =>
    setDrafts((d) => ({
      ...d,
      [selectedName]: { ...(d[selectedName] || {}), [occasion]: value ? Number(value) : null },
    }));

  const commit = () => {
    const merged = { ...normalize(personBudgets[selectedName]), ...(drafts[selectedName] || {}) };
    setPersonBudget(selectedName, merged);
  };

  const selectedDraft = drafts[selectedName] || {};
  const selectedLimit = totalOf({ ...normalize(personBudgets[selectedName]), ...selectedDraft });

  return (
    <div className="mb-5">
      {warnings.map((w) => {
        const actionable = w.over && onSelectPerson && selectedPersonId;
        if (actionable) {
          return (
            <button
              type="button"
              key={w.person}
              onClick={() => onSelectPerson(selectedPersonId)}
              className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 mb-2 w-full text-left bg-destructive/10 text-destructive active:scale-[0.99] transition-transform"
            >
              <AlertTriangle size={16} className="shrink-0" />
              <p className="text-xs font-medium flex-1">
                {`Over budget for ${w.person}: $${w.spent} of $${w.limit}`}
              </p>
              <span className="text-[11px] font-semibold shrink-0">View →</span>
            </button>
          );
        }
        return (
          <div
            key={w.person}
            className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 mb-2 ${
              w.over ? 'bg-destructive/10 text-destructive' : 'bg-accent/15 text-accent'
            }`}
          >
            <AlertTriangle size={16} className="shrink-0" />
            <p className="text-xs font-medium">
              {w.over
                ? `Over budget for ${w.person}: $${w.spent} of $${w.limit}`
                : `Approaching budget limit for ${w.person}: $${w.spent} of $${w.limit}`}
            </p>
          </div>
        );
      })}

      <div className="bg-card rounded-2xl border border-border p-3.5 mb-2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-semibold">{selectedName} — budget by occasion</span>
          <span className="text-xs text-muted-foreground">{limit ? `$${spentForSelected} of $${limit}` : `$${spentForSelected} spent`}</span>
        </div>
        <div className="space-y-2">
          {OCCASIONS.map((occ) => {
            const budgeted = Number(occasionBudget[occ]) || 0;
            const spent = occasionSpent[occ] || 0;
            const remaining = budgeted - spent;
            const r = budgeted ? Math.min(1, spent / budgeted) : 0;
            const hasAny = budgeted > 0 || spent > 0;
            if (!hasAny) {
              return (
                <div key={occ} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{occ}</span>
                  <span className="text-muted-foreground/60">—</span>
                </div>
              );
            }
            return (
              <div key={occ}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{occ}</span>
                  <span className={remaining < 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {budgeted > 0 ? `$${spent} of $${budgeted}` : `$${spent} spent`}
                  </span>
                </div>
                {budgeted > 0 && (
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r >= 1 ? 'bg-destructive' : r >= 0.8 ? 'bg-accent' : 'bg-primary'}`}
                      style={{ width: `${r * 100}%` }}
                    />
                  </div>
                )}
                {budgeted > 0 && (
                  <p className={`text-[10px] mt-0.5 ${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {remaining >= 0 ? `$${remaining} remaining` : `$${Math.abs(remaining)} over`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => (editing ? setEditing(false) : startEditing())} className="text-xs font-medium text-primary">
        {editing ? 'Hide budget limits' : `Set budget limits for ${selectedName}`}
      </button>

      {editing && (
        <div className="mt-2.5 bg-card rounded-xl border border-border p-3 space-y-3">
          <div>
            <span className="text-sm font-medium truncate block">{selectedName}</span>
            <span className="text-[11px] text-muted-foreground">Total: ${selectedLimit}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {OCCASIONS.map((occ) => (
              <div key={occ} className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">{occ}</span>
                <Input
                  type="number"
                  value={selectedDraft[occ] ?? ''}
                  onChange={(e) => updateDraft(occ, e.target.value)}
                  onBlur={commit}
                  placeholder="$"
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}