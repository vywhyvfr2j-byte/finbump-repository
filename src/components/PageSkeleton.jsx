import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Generic loading placeholder shown while a lazy-loaded page chunk downloads.
// Mimics the Home page layout so the transition feels seamless — header,
// countdown hero, reminder cards, and a bottom nav bar silhouette.
export default function PageSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-1">
        <Skeleton className="w-28 h-10 rounded-lg" />
      </div>

      {/* Greeting */}
      <div className="px-5 pt-3 pb-2">
        <Skeleton className="w-32 h-4 mb-2" />
        <Skeleton className="w-64 h-7" />
      </div>

      {/* Countdown hero */}
      <div className="px-5 mt-4">
        <Skeleton className="w-full h-20 rounded-3xl" />
      </div>

      {/* Reminder cards */}
      <div className="px-5 mt-5 space-y-2.5">
        <Skeleton className="w-full h-16 rounded-2xl" />
        <Skeleton className="w-full h-16 rounded-2xl" />
        <Skeleton className="w-full h-16 rounded-2xl" />
      </div>

      {/* Act list */}
      <div className="px-5 mt-6 space-y-2">
        <Skeleton className="w-24 h-4 mb-2" />
        <Skeleton className="w-full h-14 rounded-2xl" />
        <Skeleton className="w-full h-14 rounded-2xl" />
      </div>

      {/* Bottom nav silhouette */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="flex justify-around items-center py-2.5" style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="w-8 h-2 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}