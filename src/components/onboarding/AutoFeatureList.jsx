import React from 'react';
import { Check } from 'lucide-react';

// The features that are already part of FinBump. Rows are deliberately tighter
// than the old one-card-per-item tour: one enclosure with hairline dividers
// keeps the whole list easy to take in on a phone, and a single check mark per
// row says "already yours" without repeating a badge nine times.
export default function AutoFeatureList({ items }) {
  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
      {items.map((item) => (
        <div key={item.name} className="flex items-start gap-2.5 px-3.5 py-2.5">
          <Check size={15} className="mt-[3px] shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{item.name}</p>
            <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}