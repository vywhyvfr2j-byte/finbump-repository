import React from 'react';
import { cn } from '@/lib/utils';

// Warm, gradient-circle empty state for first-run / no-data screens.
// icon can be a lucide icon or a KsIcon — both render with the brand gradient.
export default function EmptyState({ icon: Icon, title, subtitle, action, className }) {
  return (
    <div className={cn('flex flex-col items-center text-center py-10 px-6', className)}>
      <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 to-accent/25" />
        {Icon && <Icon size={30} className="relative" />}
      </div>
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-[280px] leading-relaxed">{subtitle}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}