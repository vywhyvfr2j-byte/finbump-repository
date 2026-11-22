import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Plus, X, Pencil, Trash2, Share2 } from 'lucide-react';

export default function RelationshipGoals() {
  const { goals, addGoal, toggleGoal, updateGoal, deleteGoal } = useKeepsake();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    addGoal({ title: title.trim() });
    setTitle('');
    setAdding(false);
  };

  const startEdit = (g) => {
    setEditingId(g.id);
    setEditTitle(g.title);
  };

  const saveEdit = () => {
    if (!editTitle.trim() || !editingId) return;
    updateGoal(editingId, { title: editTitle.trim() });
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleShare = async () => {
    if (goals.length === 0) return;
    const lines = goals.map((g) => `${g.done ? '✓' : '○'} ${g.title}`);
    const text = `Our Relationship Goals\n\n${lines.join('\n')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Our Relationship Goals', text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Goals copied to clipboard!');
      }
    } catch (e) {
      // user cancelled or share failed — silently ignore
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title="Personal Relationship Goals"
        subtitle="Adventures ahead"
        right={
          <div className="flex items-center gap-0.5">
            {goals.length > 0 && (
              <button onClick={handleShare} className="text-primary flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary/60 transition-colors" aria-label="Share goals">
                <Share2 size={18} />
              </button>
            )}
            <button onClick={() => setAdding((v) => !v)} className="text-primary flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary/60 transition-colors" aria-label="Add goal">
              {adding ? <X size={20} /> : <Plus size={20} />}
            </button>
          </div>
        }
      />

      <div className="px-5 mt-2">
        {adding && (
          <div className="flex gap-2 mb-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Visit Japan together" className="h-11" autoFocus />
            <Button onClick={handleAdd} className="h-11 px-4">
              Add
            </Button>
          </div>
        )}

        <div className="space-y-2.5">
          {goals.map((g) => (
            editingId === g.id ? (
              <div key={g.id} className="flex gap-2 bg-card rounded-2xl border border-primary/40 p-3">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-10"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                />
                <Button onClick={saveEdit} size="icon" className="h-11 w-11 shrink-0">
                  <Check size={16} />
                </Button>
                <Button onClick={cancelEdit} variant="outline" size="icon" className="h-11 w-11 shrink-0">
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div
                key={g.id}
                className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border p-3.5"
              >
                <button
                  onClick={() => toggleGoal(g.id)}
                  className={`relative ks-hit w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    g.done ? 'bg-primary border-primary' : 'border-border'
                  }`}
                >
                  {g.done && <Check size={15} strokeWidth={3} className="text-primary-foreground" />}
                </button>
                <button
                  onClick={() => toggleGoal(g.id)}
                  className={`flex-1 text-sm font-medium text-left ${g.done ? 'line-through text-muted-foreground' : ''}`}
                >
                  {g.title}
                </button>
                <button
                  onClick={() => startEdit(g)}
                  className="text-muted-foreground hover:text-primary shrink-0 p-1"
                  aria-label="Edit goal"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                  aria-label="Delete goal"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          ))}
          {goals.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="font-medium">No goals yet</p>
              <p className="text-sm mt-1">Add adventures you want to share together.</p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}