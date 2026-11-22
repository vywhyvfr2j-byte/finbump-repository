import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { ExternalLink, Check, X, ShoppingBag } from 'lucide-react';
import { purchaseUrlFor, hasDirectLink } from '@/lib/giftPurchase';

export default function SampleRecommendations() {
  const { recommendations, addGiftIdea, settings, updateSettings } = useKeepsake();
  const [savedIds, setSavedIds] = useState(() => new Set());

  if (settings?.defaultsDismissed || !recommendations?.length) return null;

  const handleSave = (rec) => {
    addGiftIdea({
      title: rec.title,
      link: rec.link || '',
      note: rec.reason || '',
      source: 'sample',
    });
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.add(rec.id);
      return next;
    });
  };

  const handleDismiss = () => updateSettings({ defaultsDismissed: true });

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-base font-semibold leading-tight">A few gift ideas to get you started</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Save any you like to your gift list. Dismiss to hide these for good.</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss sample ideas"
          className="shrink-0 w-11 h-11 -m-1 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary/60 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          const saved = savedIds.has(rec.id);
          return (
            <div key={rec.id} className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm">
              <div className="aspect-[16/10] bg-secondary overflow-hidden">
                <img src={rec.img} alt={rec.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold leading-snug">{rec.title}</h3>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">{rec.priceRange}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed whitespace-normal break-words">{rec.reason}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {saved ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 px-3.5 py-2 rounded-full">
                      <Check size={14} /> Saved to your list
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSave(rec)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground bg-primary px-3.5 py-2 rounded-full"
                    >
                      Save idea
                    </button>
                  )}
                  <a
                    href={purchaseUrlFor(rec)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 px-3.5 py-2 rounded-full"
                  >
                    {hasDirectLink(rec) ? <ExternalLink size={14} /> : <ShoppingBag size={14} />}
                    {hasDirectLink(rec) ? 'Shop' : 'Find online'}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="w-full mt-4 text-sm font-medium text-muted-foreground py-2.5 rounded-xl border border-border hover:bg-secondary/60 transition-colors"
      >
        No thanks, hide these
      </button>
    </div>
  );
}