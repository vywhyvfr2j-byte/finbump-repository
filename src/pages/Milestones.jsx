import React, { useState, useMemo, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { formatDate } from '@/lib/keepsakeUtils';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Bell, BellOff, Flag, Pencil, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useConfirm } from '@/components/ui/confirm-dialog';

const emptyForm = { title: '', date: '', description: '', reminderOn: false, reminderDaysStr: '30,7,3' };

export default function Milestones() {
  const { milestones, addMilestone, updateMilestone, deleteMilestone, completeMilestone } = useKeepsake();
  const { confirm, confirmDialog } = useConfirm();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const sorted = useMemo(
    () => [...milestones].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [milestones]
  );

  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (!q) return;
    const match = milestones.find((m) => m.title.toLowerCase().includes(q.toLowerCase()));
    if (match) {
      setHighlightId(match.id);
      setTimeout(() => {
        document.getElementById(`milestone-${match.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [milestones]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setAdding(false);
  };

  const startEdit = (m) => {
    const reminderOn = Array.isArray(m.reminderDays) && m.reminderDays.length > 0;
    setEditingId(m.id);
    setAdding(false);
    setForm({
      title: m.title || '',
      date: m.date ? m.date.slice(0, 10) : '',
      description: m.description || '',
      reminderOn,
      reminderDaysStr: reminderOn ? m.reminderDays.join(',') : '30,7,3',
    });
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return;
    const reminderDays = form.reminderOn
      ? form.reminderDaysStr.split(',').map((d) => Number(d.trim())).filter((d) => !Number.isNaN(d))
      : [];
    const payload = {
      title: form.title.trim(),
      date: new Date(form.date).toISOString(),
      description: form.description.trim(),
      reminderDays,
    };
    if (editingId) {
      updateMilestone(editingId, payload);
    } else {
      addMilestone(payload);
    }
    resetForm();
  };

  const handleDelete = async (m) => {
    const answer = await confirm({
      title: `Remove "${m.title}"?`,
      description: 'It leaves your timeline and its reminders stop.',
      confirmLabel: 'Remove',
    });
    if (!answer) return;
    deleteMilestone(m.id);
    if (editingId === m.id) resetForm();
  };

  const formOpen = adding || editingId;

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title="Milestones"
        subtitle="Your timeline"
        back
        right={
          <button
            onClick={() => { if (editingId) resetForm(); setAdding((v) => !v); }}
            className="text-primary"
          >
            {formOpen ? <X size={20} /> : <Plus size={20} />}
          </button>
        }
      />

      <div className="px-5 mt-2">
        {formOpen && (
          <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5 mb-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">{editingId ? 'Edit milestone' : 'New milestone'}</h3>
            </div>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Milestone title"
              className="h-11"
            />
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="h-11"
            />
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              rows={2}
            />
            <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-3.5 py-2.5">
              <span className="text-sm font-medium flex items-center gap-1.5">
                {form.reminderOn ? <Bell size={15} /> : <BellOff size={15} />} Remind me
              </span>
              <Switch checked={form.reminderOn} onCheckedChange={(v) => setForm((f) => ({ ...f, reminderOn: v }))} />
            </div>
            {form.reminderOn && (
              <Input
                value={form.reminderDaysStr}
                onChange={(e) => setForm((f) => ({ ...f, reminderDaysStr: e.target.value }))}
                placeholder="Days before, e.g. 30,7,3"
                className="h-11"
              />
            )}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!form.title.trim() || !form.date} className="flex-1 h-11 rounded-xl">
                {editingId ? 'Save changes' : 'Add milestone'}
              </Button>
              <Button onClick={resetForm} variant="outline" className="h-11 rounded-xl px-4">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="relative pl-6">
          {sorted.length > 0 && <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />}
          <div className="space-y-6">
            {sorted.map((m) => (
              <div
                key={m.id}
                id={`milestone-${m.id}`}
                className={`relative rounded-xl transition-colors ${highlightId === m.id ? 'ring-2 ring-accent bg-accent/10 -mx-2 px-2 py-1' : ''}`}
              >
                <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/15" />
                <p className="text-xs text-muted-foreground">{formatDate(m.date)}</p>
                <p className="font-display font-semibold text-[15px] mt-0.5">{m.title}</p>
                {m.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{m.description}</p>}
                {m.lastCompletedAt && (
                  <p className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 mt-1.5">
                    <Flag size={10} /> Last marked complete {formatDate(m.lastCompletedAt)}
                  </p>
                )}
                {Array.isArray(m.reminderDays) && m.reminderDays.length === 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive mt-1.5">
                    <BellOff size={10} /> No reminder
                  </span>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => completeMilestone(m.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
                  >
                    <Flag size={12} /> {m.lastCompletedAt ? 'Complete again' : 'Mark as complete'}
                  </button>
                  <button
                    onClick={() => startEdit(m)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium">No milestones yet</p>
            <p className="text-sm mt-1">Add your first relationship milestone above.</p>
          </div>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}