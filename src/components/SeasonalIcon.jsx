import React from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { SEASONAL_ICONS } from '@/components/SeasonalIcons';

// Renders a specific theme's decorative animated icon by theme id. Not clickable.
export function ThemeIcon({ themeId, size = 16, className = '' }) {
  const Icon = SEASONAL_ICONS[themeId];
  if (!Icon) return null;
  return (
    <span
      style={{ width: size, height: size, display: 'inline-block' }}
      className={className}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}

// Decorative seasonal/holiday icon that reflects the user's current color theme.
// Larger and animated (flashing lights, fireworks, flickering flames, etc.).
// Not clickable — purely visual.
export default function SeasonalIcon({ size = 40, className = '' }) {
  const { settings } = useKeepsake();
  return <ThemeIcon themeId={settings.theme} size={size} className={className} />;
}