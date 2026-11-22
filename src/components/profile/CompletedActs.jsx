import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { actStatus, isActCompletedHidden } from '@/lib/keepsakeUtils';
import ActRow from '@/components/ActRow';
import { Button } from '@/components/ui/button';
import { Heart, CheckSquare, Trash2, X } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

// Shows acts completed within the current cycle (hidden from Home until 1 day
// before they're next due) and lets the user edit/check/delete them exactly like
// the Acts of support checklist. A "Select" mode enables removing several at
// once to keep the list tidy.
export default function CompletedActs() {
  const { profile, acts, checkOffAct, uncheckAct, deleteAct } = useKeepsake();
  const { confirm, confirmDialog } = useConfirm();
  const navigate = useNavigate();
  const partnerName = (profile.name || '').trim();

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const completed = acts
    .filter((a) => (!a.person || a.person === partnerName) && isActCompletedHidden(a))
    .sort((a, b) => new Date(b.lastCompleted) - new Date(a.lastCompleted));

  if (completed.length === 0) return null;

  const toggleSelect = (act) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(act.id)) next.delete(act.id);
      else next.add(act.id);
      return next;
    });

  const exitSelectMode = () => {
    setSelected(new Set());
    setSelectMode(false);
  };

  const removeSelected = async () => {
    if (selected.size === 0) return;
    const answer = await confirm({
      title: `Remove ${selected.size} ${selected.size === 1 ? 'act' : 'acts'}?`,
      description: 'They stop appearing in your completed list.',
      confirmLabel: 'Remove',
    });
    if (!answer) return;
    selected.forEach((id) => deleteAct(id));
    exitSelectMode();
  };

  const allSelected = selectMode && selected.size === completed.length && completed.length > 0;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(completed.map((a) => a.id)));

  return (
    <div className="bg-card rounded-2xl border border-border p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <Heart size={15} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold">Completed acts</h3>
        <span className="text-xs text-muted-foreground">{completed.length}</span>
        {!selectMode ? (
          <button
            onClick={() => setSelectMode(true)}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-primary"
            aria-label="Select acts to remove"
          >
            <CheckSquare size={14} /> Select
          </button>
        ) : (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={toggleAll}
              className="flex items-center gap-1 text-xs font-medium text-primary"
              aria-label={allSelected ? 'Deselect all' : 'Select all'}
            >
              <CheckSquare size={14} /> {allSelected ? 'None' : 'All'}
            </button>
            <button
              onClick={exitSelectMode}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
              aria-label="Cancel selecting"
            >
              <X size={14} /> Done
            </button>
          </div>
        )}
      </div>
      <div className="space-y-2.5">
        {completed.map((act) => (
          <ActRow
            key={act.id}
            act={act}
            selectable={selectMode}
            selected={selected.has(act.id)}
            onSelect={toggleSelect}
            onToggle={(a) => (actStatus(a) === 'fresh' ? uncheckAct(a.id) : checkOffAct(a.id))}
            onEdit={selectMode ? undefined : (a) => navigate(`/add-act?editId=${a.id}`)}
            onDelete={
              selectMode
                ? undefined
                : async (a) => {
                    const answer = await confirm({ title: `Remove "${a.name}"?`, confirmLabel: 'Remove' });
                    if (answer) deleteAct(a.id);
                  }
            }
          />
        ))}
      </div>

      {selectMode && selected.size > 0 && (
        <Button
          variant="destructive"
          className="w-full h-10 rounded-xl mt-3"
          onClick={removeSelected}
        >
          <Trash2 size={15} /> Remove {selected.size} {selected.size === 1 ? 'act' : 'acts'}
        </Button>
      )}
      {confirmDialog}
    </div>
  );
}