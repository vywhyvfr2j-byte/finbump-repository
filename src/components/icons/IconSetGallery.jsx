import React from 'react';
import FbIcon from '@/components/icons/FbIcon';

// Every icon in the pack, colour beside mono, so the whole set can be taken in
// at a glance.
export const FB_ICON_NAMES = [
  'home',
  'reschedule',
  'edit',
  'delete',
  'mark-complete',
  'notification',
  'ask-for-help',
  'completion-history',
  'acts-of-kindness',
  'partner',
  'calendar',
  'explore',
  'my-profile',
  'who-you-love',
  'month-ahead',
  'groups',
  'pets',
  'cards',
  'grab-a-meal',
  'message-writer',
  'relationship-notes',
  'memory-moments',
  'ideas',
  'saved-items',
  'budget-tracker',
  'care-prayer',
  'personal-notes',
  'take-a-trip',
  'history',
  'timeline',
  'year-in-moments',
  'settings',
  'user-guide',
  'suggest-a-change',
];

export default function IconSetGallery() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {FB_ICON_NAMES.map((name) => (
        <div key={name} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-1.5 py-3">
          <div className="flex items-center gap-1.5">
            <FbIcon name={name} style="color" size={26} />
            <span className="text-primary">
              <FbIcon name={name} style="mono" size={22} />
            </span>
          </div>
          <span className="text-[9px] leading-tight text-center text-muted-foreground break-words">{name}</span>
        </div>
      ))}
    </div>
  );
}