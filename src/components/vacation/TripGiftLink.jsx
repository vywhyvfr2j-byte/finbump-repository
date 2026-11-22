import React from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Check, Gift } from 'lucide-react';

export default function TripGiftLink({ trip, onToggleGift }) {
  const { giftIdeas } = useKeepsake();

  const linkedTotal = giftIdeas
    .filter((g) => trip.linkedGiftIds.includes(g.id))
    .reduce((sum, g) => sum + (g.actualCost ?? g.budget ?? 0), 0);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Link gift ideas from your gift tracker to include their cost in this trip's spending.
      </p>
      <div className="space-y-2">
        {giftIdeas.map((g) => {
          const linked = trip.linkedGiftIds.includes(g.id);
          return (
            <button
              key={g.id}
              onClick={() => onToggleGift(g.id)}
              className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left ${
                linked ? 'bg-primary/10 border-primary' : 'bg-card border-border'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  linked ? 'bg-primary border-primary' : 'border-border'
                }`}
              >
                {linked && <Check size={13} strokeWidth={3} className="text-primary-foreground" />}
              </div>
              <Gift size={15} className="text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{g.title}</p>
              </div>
              {(g.actualCost ?? g.budget) != null && (
                <span className="text-xs font-medium text-accent whitespace-nowrap">
                  ${g.actualCost ?? g.budget}
                </span>
              )}
            </button>
          );
        })}
        {giftIdeas.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No gift ideas to link yet.</p>}
      </div>
      {trip.linkedGiftIds.length > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-sm font-medium">Linked gifts total</span>
          <span className="text-sm font-semibold text-primary">${linkedTotal}</span>
        </div>
      )}
    </div>
  );
}