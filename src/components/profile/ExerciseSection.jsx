import React, { useMemo, useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dumbbell, X, Pencil } from 'lucide-react';

const PRESET_EXERCISES = [
  'Walking', 'Running', 'Yoga', 'Strength', 'Cycling',
  'Swimming', 'Stretching', 'Hiking', 'Dancing', 'Pilates',
];

const CADENCE_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '1', label: 'Every day' },
  { value: '2', label: 'Every 2 days' },
  { value: '3', label: 'Every 3 days' },
  { value: '7', label: 'Weekly' },
];

// Exercise & encouragement subsection — rendered inside the Daily Encouragement
// block. Exercises are picked from a dropdown (with custom add), editable inline,
// and a reminder cadence creates/updates a recurring health-category act.
export default function ExerciseSection() {
  const { myPreferences, updateMyPreferences, acts, addCustomAct, updateAct, deleteAct } = useKeepsake();
  const exerciseTypes = myPreferences.exerciseTypes || [];
  const exerciseNotes = myPreferences.exerciseNotes || '';
  const reminderDays = myPreferences.exerciseReminderDays || 0;
  const [editingIdx, setEditingIdx] = useState(null);
  const [editName, setEditName] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');

  const exerciseAct = useMemo(
    () => acts.find((a) => a.tag === 'exercise'),
    [acts]
  );

  const syncActName = (next) => {
    if (exerciseAct?.created_date) {
      updateAct(exerciseAct.id, {
        name: next.length ? `Exercise: ${next.join(', ')}` : 'Exercise reminder',
      });
    }
  };

  const addExercise = (name) => {
    const trimmed = name.trim();
    if (!trimmed || exerciseTypes.includes(trimmed)) return;
    const next = [...exerciseTypes, trimmed];
    updateMyPreferences({ exerciseTypes: next });
    syncActName(next);
  };

  const removeExercise = (idx) => {
    const next = exerciseTypes.filter((_, i) => i !== idx);
    updateMyPreferences({ exerciseTypes: next });
    syncActName(next);
  };

  const saveRename = (idx) => {
    const trimmed = editName.trim();
    if (!trimmed) { setEditingIdx(null); return; }
    const next = exerciseTypes.map((t, i) => (i === idx ? trimmed : t));
    updateMyPreferences({ exerciseTypes: next });
    setEditingIdx(null);
    syncActName(next);
  };

  const setReminder = (days) => {
    updateMyPreferences({ exerciseReminderDays: days });
    if (days === 0) {
      if (exerciseAct) deleteAct(exerciseAct.id);
    } else if (exerciseAct) {
      updateAct(exerciseAct.id, { intervalDays: days });
    } else {
      addCustomAct({
        name: exerciseTypes.length ? `Exercise: ${exerciseTypes.join(', ')}` : 'Exercise reminder',
        category: 'health',
        intervalDays: days,
        emoji: '🏃',
        tag: 'exercise',
        repeat: true,
        nextDue: new Date().toISOString(),
        notify: true,
      });
    }
  };

  const availablePresets = PRESET_EXERCISES.filter((p) => !exerciseTypes.includes(p));

  return (
    <div className="border-t border-border pt-3 space-y-3">
      <div className="flex items-center gap-2">
        <Dumbbell size={16} className="text-primary" />
        <p className="text-sm font-medium">Exercise & encouragement</p>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">Track exercises and add a personal nudge to keep moving.</p>

      {exerciseTypes.length > 0 && (
        <div className="space-y-1.5">
          {exerciseTypes.map((ex, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-secondary/60 rounded-xl px-3 py-2">
              {editingIdx === idx ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Exercise name"
                    className="h-8 flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(idx);
                      if (e.key === 'Escape') setEditingIdx(null);
                    }}
                  />
                  <button onClick={() => saveRename(idx)} className="text-primary text-xs font-medium px-2">Save</button>
                </>
              ) : (
                <>
                  <span className="text-sm flex-1">{ex}</span>
                  <button onClick={() => { setEditingIdx(idx); setEditName(ex); }} className="text-muted-foreground p-1" aria-label="Edit exercise">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => removeExercise(idx)} className="text-muted-foreground p-1" aria-label="Remove exercise">
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!addingCustom ? (
        <Select
          value=""
          onValueChange={(v) => {
            if (v === '__custom') setAddingCustom(true);
            else addExercise(v);
          }}
        >
          <SelectTrigger className="h-10" aria-label="Add an exercise">
             <SelectValue placeholder="+ Add an exercise…" />
          </SelectTrigger>
          <SelectContent>
            {availablePresets.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
            {availablePresets.length === 0 && (
              <SelectItem value="__custom" disabled>All presets added — add a custom one</SelectItem>
            )}
            <SelectItem value="__custom">+ Add custom…</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Exercise name"
            aria-label="Custom exercise name"
            className="h-10 flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addExercise(customName);
                setCustomName('');
                setAddingCustom(false);
              }
              if (e.key === 'Escape') { setAddingCustom(false); setCustomName(''); }
            }}
          />
          <Button
            size="sm"
            onClick={() => {
              addExercise(customName);
              setCustomName('');
              setAddingCustom(false);
            }}
            disabled={!customName.trim()}
          >
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAddingCustom(false); setCustomName(''); }}>
            Cancel
          </Button>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reminders & encouragement</label>
        <Textarea
          value={exerciseNotes}
          onChange={(e) => updateMyPreferences({ exerciseNotes: e.target.value })}
          rows={3}
          placeholder="Tips and encouragement for yourself — e.g. 'Start with a 10-min walk', 'Stretch after every run'…"
          aria-label="Exercise notes and encouragement"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Exercise reminder</label>
        <Select value={String(reminderDays)} onValueChange={(v) => setReminder(Number(v))}>
          <SelectTrigger className="h-11" aria-label="Exercise reminder cadence">
            <SelectValue placeholder="Off" />
          </SelectTrigger>
          <SelectContent>
            {CADENCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {reminderDays > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1.5">Added to your acts as a recurring health reminder.</p>
        )}
      </div>
    </div>
  );
}