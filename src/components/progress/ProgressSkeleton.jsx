import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton placeholder shown while progress / history data loads from
// the backend. Mirrors the Progress page layout (stat cards + chart +
// goal editor) so the transition to real data is visually seamless.
export default function ProgressSkeleton() {
  return (
    <div className="space-y-5">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border p-4 shadow-card ks-card-tint">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
        <Skeleton className="h-5 w-48 mb-3" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      {/* Goal editor skeleton */}
      <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}