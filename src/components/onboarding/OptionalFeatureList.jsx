import React from 'react';
import { Switch } from '@/components/ui/switch';

// The choices that are genuinely the user's. Each row's switch flips the
// matching key in the onboarding `selections` state, which is applied to a real
// setting or preference when setup finishes — so a feature switched off here
// really does go quiet.
export default function OptionalFeatureList({ items, selections, onToggle }) {
  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
      {items.map((item) => (
        <div key={item.selKey} className="flex items-start gap-3 px-3.5 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{item.name}</p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">{item.desc}</p>
          </div>
          <Switch
            checked={!!selections[item.selKey]}
            onCheckedChange={() => onToggle(item.selKey)}
            aria-label={`Turn ${item.name} on or off`}
            className="mt-0.5 shrink-0"
          />
        </div>
      ))}
    </div>
  );
}