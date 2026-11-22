import React, { useState } from 'react';
import {
  Bell, AlertCircle, Heart, HandHeart, Sparkles, Check, Clock, Moon, Lightbulb, Pencil, Trash2, Footprints,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TYPE_ICON = {
  overdue: AlertCircle,
  due: Bell,
  health: Heart,
  care: Heart,
  prayer: HandHeart,
  other: Sparkles,
  memory_refresh: Clock,
  memory: Moon,
  occasion: Bell,
  encouragement: Sparkles,
  admin_insight: Lightbulb,
  little_steps: Footprints,
};

const SEVERITY_DOT = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-sky-500',
};

const formatDueDate = (dueDate) => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - dueDay.getTime()) / 86400000);
  const dateStr = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (diffDays === 0) return `Due today · ${dateStr}`;
  if (diffDays > 0) return `Was due ${dateStr} · ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return `Due ${dateStr} · in ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
};

// One notification in the feed with its three actions: delete (confirmed, and it
// warns that the source act leaves current and future reminders), acknowledge
// (crosses the item out as reviewed) and edit (opens the act or contact editor).
export default function NotificationRow({ notification: n, personName, deleteWarning, onOpen, onAcknowledge, onDelete, onEdit }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const Icon = TYPE_ICON[n.type] || Bell;
  const reviewed = Boolean(n.read || n.completed);
  const isActType = n.type === 'overdue' || n.type === 'due';
  const forLabel = personName || (isActType ? 'General' : null);
  const dueLabel = n.dueDate ? formatDueDate(n.dueDate) : (isActType ? 'No due date' : null);
  const stop = (e) => e.stopPropagation();

  return (
    <>
      <div
        className={`flex gap-2.5 p-3.5 rounded-2xl bg-card border border-border shadow-card cursor-pointer hover:border-primary/40 ${
          reviewed ? 'opacity-60' : 'ring-1 ring-primary/30'
        }`}
        onClick={onOpen}
      >
        <div className="shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary/40">
            <Icon size={18} className="text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {forLabel && (
            <p className={`text-[11px] font-semibold text-primary/80 mb-0.5 ${reviewed ? 'line-through' : ''}`}>
              For {forLabel}
            </p>
          )}
          <div className="flex items-center gap-2">
            <p className={`text-[15px] font-display font-semibold leading-snug ${reviewed ? 'line-through' : ''}`}>{n.title}</p>
            {!reviewed && <span className={`shrink-0 w-2 h-2 rounded-full ${SEVERITY_DOT[n.severity] || 'bg-primary'}`} />}
          </div>
          <p className={`text-[13px] text-muted-foreground mt-1 leading-snug whitespace-pre-line ${reviewed ? 'line-through' : ''}`}>{n.body}</p>
          {dueLabel && (
            <p className={`text-[11px] font-medium mt-1.5 flex items-center gap-1 ${reviewed ? 'text-muted-foreground/60' : 'text-primary/70'}`}>
              <Clock size={11} className="shrink-0" />
              {dueLabel}
            </p>
          )}
        </div>
        <div className="shrink-0 flex flex-col gap-1">
          <button
            onClick={(e) => { stop(e); setConfirmOpen(true); }}
            className="flex items-center justify-center w-11 h-11 rounded-lg bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Delete reminder"
            title="Delete reminder"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={(e) => { stop(e); if (!reviewed) onAcknowledge(); }}
            disabled={reviewed}
            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
              reviewed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-primary/10'
            }`}
            aria-label={reviewed ? 'Reviewed' : 'Acknowledge reminder'}
            title={reviewed ? 'Reviewed' : 'Acknowledge — mark as reviewed'}
          >
            <Check size={14} />
          </button>
          {onEdit && (
            <button
              onClick={(e) => { stop(e); onEdit(); }}
              className="flex items-center justify-center w-11 h-11 rounded-lg bg-secondary text-muted-foreground hover:bg-primary/10 transition-colors"
              aria-label="Edit reminder"
              title="Edit frequency and who it's for"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[360px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-base">Delete this reminder?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}