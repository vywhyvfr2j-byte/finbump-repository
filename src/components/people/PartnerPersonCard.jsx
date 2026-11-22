import React from 'react';
import { RELATIONS } from '@/lib/peopleConstants';
import { CATEGORIES, CATEGORY_ICONS } from '@/lib/giftConstants';

// Read-only view of a person shared by a paired partner.
export default function PartnerPersonCard({ person }) {
  const info = RELATIONS.find((r) => r.key === person.relation) || RELATIONS[4];
  const preferences = person.preferences || {};
  const hasPrefs = CATEGORIES.some((cat) => preferences[cat]);

  return (
    <div className="bg-secondary/40 rounded-2xl border border-border p-4">
      <p className="font-medium text-sm truncate">
        {info.emoji} {person.preferredName || person.name}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{info.label}</p>
      {person.notes && <p className="text-xs text-muted-foreground mt-1.5">{person.notes}</p>}
      {hasPrefs && (
        <div className="mt-2.5 space-y-1">
          {CATEGORIES.filter((cat) => preferences[cat]).map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <Icon size={14} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{cat}:</span>
                <span className="font-medium">{preferences[cat]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}