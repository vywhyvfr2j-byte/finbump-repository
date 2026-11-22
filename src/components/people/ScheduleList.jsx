import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { actStatus, formatDate, nextDueDate, urgencyScore } from '@/lib/keepsakeUtils';
import { CATEGORY_BY_KEY } from '@/lib/actTags';
import { Pencil, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

const STATUS_DOT = {
  overdue: 'bg-red-500',
  soon: 'bg-amber-500',
  fresh: 'bg-emerald-500',
  idle: 'bg-red-500',
};

// Lists every scheduled item (act / prayer / health / other) scoped to a single
// contact, grouped by category. Replaces the old single health & prayer cards on
// the contact profile — all scheduled items live on one list here.
export default function ScheduleList({ personName, personId }) {
  const { acts, deleteAct } = useKeepsake();
  const { confirm, confirmDialog } = useConfirm();
  const navigate = useNavigate();

  const items = useMemo(() => {
    const belongs = (a) =>
      personId && a.personId
        ? String(a.personId) === String(personId)
        : (a.person || '') === personName;
    return acts
      .filter(belongs)
      .sort((a, b) => urgencyScore(b) - urgencyScore(a));
  }, [acts, personId, personName]);

  if (!items.length) return null;

  const groups = ['act', 'prayer', 'health', 'other']
    .map((key) => ({ key, label: CATEGORY_BY_KEY[key]?.label, list: items.filter((a) => (a.category || 'act') === key) }))
    .filter((g) => g.list.length);

  const cadenceLabel = (a) => {
    if (a.repeat === false) return 'One-time';
    const d = a.intervalDays;
    if (!d) return '';
    if (d % 7 === 0) return `Every ${d / 7} week${d / 7 === 1 ? '' : 's'}`;
    if (d % 30 === 0) return `Every ${d / 30} month${d / 30 === 1 ? '' : 's'}`;
    return `Every ${d} day${d === 1 ? '' : 's'}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Acts &amp; reminders</p>
      {groups.map((g) => (
        <div key={g.key} className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{CATEGORY_BY_KEY[g.key]?.emoji}</span>
            <span className="text-xs font-semibold text-muted-foreground">{g.label}</span>
            <span className="text-xs text-muted-foreground">{g.list.length}</span>
          </div>
          <div className="space-y-2">
            {g.list.map((a) => {
              const status = actStatus(a);
              const due = nextDueDate(a);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 bg-card rounded-xl ring-1 ring-border shadow-sm px-3 py-2"
                >
                  <span className="text-lg shrink-0">{a.emoji || '✨'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">{a.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                      <span className="text-xs text-muted-foreground truncate">
                        {due ? `Due ${formatDate(due)}` : a.lastCompleted ? `Done ${formatDate(a.lastCompleted)}` : 'Not yet'}
                        {cadenceLabel(a) ? ` · ${cadenceLabel(a)}` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/add-act?editId=${a.id}`)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                    aria-label="Edit item"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      const answer = await confirm({ title: `Remove "${a.name}"?`, confirmLabel: 'Remove' });
                      if (answer) deleteAct(a.id);
                    }}
                    className="w-11 h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                    aria-label="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {confirmDialog}
    </div>
  );
}