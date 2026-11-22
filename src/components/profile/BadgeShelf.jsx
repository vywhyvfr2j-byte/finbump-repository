import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useBadges } from '@/hooks/useBadges';
import { BADGES, BADGE_COUNT } from '@/lib/badges';
import { BadgeMark } from '@/components/profile/badgeParts';
import BadgeListSheet from '@/components/profile/BadgeListSheet';

const SHOWN = 5;

// The profile shelf: a small row of the marks a member has earned, with the
// count beside it. Tapping opens the whole catalog, where locked badges say what
// would earn them. Awarding happens server-side (award-badges) when this loads,
// so badges earned elsewhere appear here without any extra step.
export default function BadgeShelf() {
  const { earned, progress } = useBadges();
  const [open, setOpen] = useState(false);

  const earnedBadges = BADGES.filter((badge) => earned[badge.id]);
  const extra = Math.max(0, earnedBadges.length - SHOWN);

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-card">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-label="See all keepsakes"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium">Keepsakes</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {earnedBadges.length > 0
              ? `${earnedBadges.length} of ${BADGE_COUNT} earned`
              : 'Your first mark is one small step away'}
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {earnedBadges.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          {earnedBadges.slice(0, SHOWN).map((badge) => (
            <BadgeMark key={badge.id} badge={badge} earned size={34} />
          ))}
          {extra > 0 && (
            <span className="ml-0.5 text-xs font-medium text-muted-foreground">+{extra}</span>
          )}
        </div>
      )}

      <BadgeListSheet open={open} onOpenChange={setOpen} earned={earned} progress={progress} />
    </div>
  );
}