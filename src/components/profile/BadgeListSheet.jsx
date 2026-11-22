import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BADGES, SHELVES } from '@/lib/badges';
import { BadgeMark, earnedLabel, progressLabel } from '@/components/profile/badgeParts';

// Every badge in the catalog, grouped by shelf — earned ones with the day they
// were given, the rest with what would earn them and honest progress. There is
// no leaderboard and no sharing here on purpose.
export default function BadgeListSheet({ open, onOpenChange, earned, progress }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-left">Your keepsakes</SheetTitle>
        </SheetHeader>

        <div className="pb-[calc(1.5rem_+_env(safe-area-inset-bottom))]">
          {SHELVES.map((shelf) => {
            const badges = BADGES.filter((badge) => badge.shelf === shelf.id);
            if (!badges.length) return null;
            return (
              <section key={shelf.id} className="mt-4">
                <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {shelf.label}
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {badges.map((badge) => {
                    const isEarned = Boolean(earned[badge.id]);
                    return (
                      <li
                        key={badge.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 ${
                          isEarned ? 'border-primary/25 bg-primary/5' : 'border-border bg-card'
                        }`}
                      >
                        <BadgeMark badge={badge} earned={isEarned} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">{badge.name}</p>
                          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                            {isEarned ? earnedLabel(earned[badge.id]) : progressLabel(badge, progress)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          <p className="mt-5 px-1 text-xs leading-relaxed text-muted-foreground">
            Badges are yours alone — nothing is ranked, compared or shared.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}