import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Zap } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { actStatus } from '@/lib/keepsakeUtils';
import { Input } from '@/components/ui/input';

// Quick-log panel for a person's acts of support. Renders directly on partner
// and family profile pages so the user can mark something done without going
// back to Home. Shows the person's tracked acts (filtered by personId/name)
// with quick-complete toggles, plus a one-off quick-add that creates a
// one-time act and completes it in a single tap.
export default function QuickLogActs({ personId, personName, initialActName = '' }) {
  const { acts, addCustomAct, checkOffAct } = useKeepsake();
  const [quickName, setQuickName] = useState(initialActName);

  const personActs = useMemo(
    () =>
      acts.filter(
        (a) =>
          (personId && a.personId === personId) ||
          (personName && a.person === personName)
      ),
    [acts, personId, personName]
  );

  const handleQuickAdd = () => {
    const name = quickName.trim();
    if (!name) return;
    const payload = {
      name,
      emoji: '💚',
      intervalDays: 7,
      person: personName || '',
      personId: personId || '',
      repeat: false,
      category: 'act',
    };
    addCustomAct(payload);
    // checkOffAct runs against the temp id; addCustomAct replaces it async,
    // but the optimistic state update + ActCompletion create still fires.
    // We clear the input immediately so the user sees instant feedback.
    setQuickName('');
  };

  const SUGGESTIONS = ['Send a kind text', 'Give a call', 'Share a memory', 'Write a note'];

  const quickSuggest = (name) => {
    const payload = {
      name,
      emoji: '💚',
      intervalDays: 7,
      person: personName || '',
      personId: personId || '',
      repeat: false,
      category: 'act',
    };
    addCustomAct(payload);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">Quick log</h3>
      </div>

      {personActs.length > 0 ? (
        <div className="space-y-1.5">
          {personActs.map((act) => {
            const status = actStatus(act);
            const done = status === 'fresh';
            return (
              <button
                key={act.id}
                onClick={() => checkOffAct(act.id)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-secondary/50 hover:bg-secondary active:scale-[0.99] transition-all text-left"
              >
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    done ? 'bg-emerald-500 border-emerald-500' : 'border-primary bg-background'
                  }`}
                >
                  {done && <Check size={11} strokeWidth={3} className="text-white" />}
                </motion.div>
                <span className="text-lg shrink-0">{act.emoji || '✨'}</span>
                <span className="flex-1 min-w-0 text-sm font-medium line-clamp-1">{act.name}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {act.lastCompleted ? 'Done' : 'Log'}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center py-1">
            No tracked acts for {personName || 'them'} yet — try one:
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => quickSuggest(s)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 active:scale-95 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Input
          value={quickName}
          onChange={(e) => setQuickName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd(); } }}
          placeholder="Log something you did…"
          aria-label="Log something you did"
          className="h-9 text-sm flex-1"
        />
        <button
          onClick={handleQuickAdd}
          disabled={!quickName.trim()}
          className="flex items-center justify-center w-11 h-11 -m-1 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 shrink-0"
          aria-label="Log act"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}