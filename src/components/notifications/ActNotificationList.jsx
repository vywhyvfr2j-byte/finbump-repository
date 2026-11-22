import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react';

// Editable list of acts for the per-item notification controls. Supports
// adding new acts, renaming existing ones, toggling notifications per act,
// and deleting acts — all persisted through the keepsake store.
export default function ActNotificationList() {
  const { acts, addCustomAct, updateAct, deleteAct } = useKeepsake();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addCustomAct({ name });
    setNewName('');
  };

  const startEdit = (act) => {
    setEditingId(act.id);
    setEditValue(act.name);
  };

  const saveEdit = () => {
    const name = editValue.trim();
    if (name && editingId) updateAct(editingId, { name });
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="space-y-2">
      <div className="rounded-2xl bg-card border border-border divide-y divide-border">
        {acts.length === 0 && (
          <p className="text-xs text-muted-foreground p-3">No acts yet. Add one below.</p>
        )}
        {acts.map((a) => (
          <div key={a.id} className="flex items-center gap-2 p-3">
            {editingId === a.id ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  className="h-8 text-sm flex-1"
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  className="w-11 h-11 flex items-center justify-center rounded-md hover:bg-secondary/60"
                  aria-label="Save name"
                >
                  <Check size={15} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="w-11 h-11 flex items-center justify-center rounded-md hover:bg-secondary/60"
                  aria-label="Cancel edit"
                >
                  <X size={15} />
                </button>
              </>
            ) : (
              <>
                <p className="text-sm truncate flex-1">
                  {a.emoji ? `${a.emoji} ` : ''}
                  {a.name}
                </p>
                <button
                  onClick={() => startEdit(a)}
                  className="w-11 h-11 flex items-center justify-center rounded-md hover:bg-secondary/60 text-muted-foreground"
                  aria-label={`Edit ${a.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteAct(a.id)}
                  className="w-11 h-11 flex items-center justify-center rounded-md hover:bg-secondary/60 text-muted-foreground"
                  aria-label={`Delete ${a.name}`}
                >
                  <Trash2 size={14} />
                </button>
                <Switch
                  checked={a.notify !== false}
                  onCheckedChange={(v) => updateAct(a.id, { notify: v })}
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add a new act"
          className="h-9 text-sm"
        />
        <Button onClick={handleAdd} size="sm" className="h-9 rounded-lg shrink-0">
          <Plus size={16} /> Add
        </Button>
      </div>
    </div>
  );
}