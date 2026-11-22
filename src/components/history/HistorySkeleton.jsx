import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton placeholder shown while history completions load from the
// backend. Mirrors the CompletionLog layout (filter bar + grouped list)
// so the transition to real data is visually seamless.
export default function HistorySkeleton() {
  return (
    <div>
      {/* Filter bar skeleton */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
      {/* Search bar skeleton */}
      <Skeleton className="h-10 rounded-xl mb-4" />
      {/* Grouped list skeleton */}
      <div className="space-y-5">
        {[0, 1].map((group) => (
          <div key={group}>
            <Skeleton className="h-4 w-24 mb-1.5" />
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {[0, 1, 2, 3].map((row) => (
                <div
                  key={row}
                  className={`flex items-center gap-2.5 px-3 py-2 ${row > 0 ? 'border-t border-border/60' : ''}`}
                >
                  <Skeleton className="w-6 h-6 rounded shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}