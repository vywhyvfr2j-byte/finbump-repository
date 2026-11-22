import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Trophy } from 'lucide-react';

// Admin-only list of every app-improvement suggestion submitted via the
// "Suggest a Change" page. Monthly winners are flagged by the
// draw-suggestion-winner backend function.
export default function SuggestionManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      setItems(await base44.entities.AppSuggestion.list('-created_date', 200));
    } catch (e) {
      console.error('SuggestionManager load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div>
        <p className="font-display text-base font-semibold">Suggestion box</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Every suggestion submitted via "Suggest a Change". The monthly drawing picks one and emails you the winner.
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No suggestions yet.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.map((s) => (
            <div key={s.id} className="rounded-xl border border-border p-2.5 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                  {s.category}
                </span>
                <span className="text-xs text-muted-foreground">{s.monthKey}</span>
                {s.isWinner && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Trophy className="size-3" /> Winner
                  </span>
                )}
              </div>
              <p className="text-xs">{s.message}</p>
              <p className="text-[11px] text-muted-foreground">
                {s.userName || 'Anonymous'}{s.userEmail ? ` · ${s.userEmail}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}