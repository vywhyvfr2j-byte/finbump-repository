import React from 'react';
import { format } from 'date-fns';

// Presentation-only pieces of the badge set, shared by the profile shelf and
// its "all keepsakes" sheet.

// Small circular mark. Earned badges sit on the warm brand tint; locked ones
// stay quiet and muted, because a vault should never look like a scoreboard.
export function BadgeMark({ badge, earned, size = 36 }) {
  const { Icon } = badge;
  const iconSize = Math.round(size * 0.47);
  return (
    <span
      className={
        earned
          ? 'flex shrink-0 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/25'
          : 'flex shrink-0 items-center justify-center rounded-full bg-secondary/70 opacity-45'
      }
      style={{ width: size, height: size }}
    >
      <Icon size={iconSize} aria-hidden="true" />
    </span>
  );
}

export function earnedLabel(earnedAt) {
  if (!earnedAt) return 'Earned';
  const date = new Date(earnedAt);
  if (Number.isNaN(date.getTime())) return 'Earned';
  return `Earned ${format(date, 'MMMM d, yyyy')}`;
}

export function progressLabel(badge, progress) {
  const done = Math.min(progress?.[badge.id] || 0, badge.target);
  if (badge.target <= 1) return badge.how;
  return `${done} of ${badge.target} ${badge.unit}`;
}