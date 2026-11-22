import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useKeepsake } from '@/lib/keepsakeStore';

// Lets the user review every item of theirs that would become visible to a
// partner once paired, and uncheck any they don't want shared before approving.
export default function ShareConsentDialog({ open, onClose, onApprove, submitting }) {
  const { people, movieIdeas, bookIdeas, seriesIdeas, drinks, snacks, meals, desserts } = useKeepsake();
  const treatIdeas = useMemo(() => [...drinks, ...snacks, ...meals, ...desserts], [drinks, snacks, meals, desserts]);

  const groups = useMemo(
    () => [
      { key: 'people', label: 'People', items: people, labelFn: (p) => p.name },
      { key: 'movieIdeas', label: 'Movie ideas', items: movieIdeas, labelFn: (m) => m.title },
      { key: 'bookIdeas', label: 'Book ideas', items: bookIdeas, labelFn: (b) => b.title },
      { key: 'seriesIdeas', label: 'Series ideas', items: seriesIdeas, labelFn: (sr) => sr.title },
      { key: 'treatIdeas', label: 'Treats', items: treatIdeas, labelFn: (t) => t.title },
    ],
    [people, movieIdeas, bookIdeas, seriesIdeas, treatIdeas]
  );

  const [checked, setChecked] = useState({});

  const isChecked = (key, id) => checked[`${key}:${id}`] !== false;
  const toggle = (key, id) =>
    setChecked((c) => ({ ...c, [`${key}:${id}`]: !isChecked(key, id) }));

  const handleApprove = () => {
    const exclusions = {};
    groups.forEach(({ key, items }) => {
      exclusions[key] = items.filter((i) => !isChecked(key, i.id)).map((i) => i.id);
    });
    onApprove(exclusions);
  };

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review what you'll share</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Once paired, checked items become visible to your partner. Uncheck anything you'd rather keep private.
        </p>
        <div className="flex-1 overflow-y-auto space-y-4 -mx-1 px-1">
          {totalItems === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">You have nothing saved yet to share.</p>
          )}
          {groups.map(({ key, label, items, labelFn }) =>
            items.length > 0 ? (
              <div key={key}>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 bg-secondary/40 rounded-lg px-3 py-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={isChecked(key, item.id)}
                        onCheckedChange={() => toggle(key, item.id)}
                      />
                      <span className="text-sm truncate">{labelFn(item) || 'Untitled'}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
        <DialogFooter className="flex-row gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleApprove} className="flex-1" disabled={submitting}>
            {submitting ? 'Pairing…' : 'Approve & pair'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}