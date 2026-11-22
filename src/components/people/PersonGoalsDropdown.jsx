import React, { useState, useMemo } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { ChevronDown, Plus, X, Check, Trash2, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Collapsible goals section shown on each connection's profile page.
// Goals created here are linked to the person via personId so they appear
// in the overall bar graph filtered by that connection.
export default function PersonGoalsDropdown({ personId, personName }) {
  useEnsureEntities(['goals']);
  const { goals, addGoal, toggleGoal, deleteGoal } = useKeepsake();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const pid = personId || '';
  const personGoals = useMemo(
    () => goals.filter((g) => (g.personId || '') === pid),
    [goals, pid]
  );
  const doneCount = personGoals.filter((g) => g.done).length;

  const handleAdd = () => {
    if (!title.trim()) return;
    addGoal({ title: title.trim(), personId: pid });
    setTitle('');
    setAdding(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3.5"
      >
        <span className="flex items-center gap-2 font-display text-sm font-semibold">
          <Target size={16} /> Goals
          {personGoals.length > 0 && (
            <span className="text-xs text-muted-foreground font-body">
              {doneCount}/{personGoals.length}
            </span>
          )}
        </span>
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 space-y-2">
          {personGoals.map((g) => (
            <div key={g.id} className="flex items-center gap-2.5">
              <button
                onClick={() => toggleGoal(g.id)}
                className={`relative ks-hit w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  g.done ? 'bg-primary border-primary' : 'border-border'
                }`}
              >
                {g.done && <Check size={13} strokeWidth={3} className="text-primary-foreground" />}
              </button>
              <span className={`flex-1 text-sm ${g.done ? 'line-through text-muted-foreground' : ''}`}>
                {g.title}
              </span>
              <button
                onClick={() => deleteGoal(g.id)}
                className="text-muted-foreground hover:text-destructive shrink-0 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {personGoals.length === 0 && !adding && (
            <p className="text-sm text-muted-foreground text-center py-3">
              No goals for {personName || 'this connection'} yet.
            </p>
          )}

          {adding ? (
            <div className="flex gap-2 pt-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Take a trip together"
                className="h-9"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button onClick={handleAdd} size="sm" className="h-9 px-3">Add</Button>
              <Button onClick={() => { setAdding(false); setTitle(''); }} variant="outline" size="sm" className="h-9 px-3">
                <X size={14} />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-sm text-primary font-medium pt-1"
            >
              <Plus size={15} /> Add a goal
            </button>
          )}
        </div>
      )}
    </div>
  );
}