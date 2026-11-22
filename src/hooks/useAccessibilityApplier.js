import { useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';

// Applies accessibility settings app-wide by toggling CSS classes on
// <html>. Mounted once in App.jsx's FinBumpGate so it runs on every
// settings change.
//
// - textSize: sets font-size on <html> so rem-based Tailwind scales up.
// - highContrast: adds a class that boosts border opacity and text color.
// - reduceMotion: disables framer-motion animations via a CSS class.
export function useAccessibilityApplier() {
  const { settings } = useKeepsake();
  const acc = settings.accessibility || {};

  useEffect(() => {
    const html = document.documentElement;

    // Text size — scales the root font-size so all rem-based Tailwind
    // classes scale proportionally.
    const sizeMap = { normal: '16px', large: '18px', xlarge: '20px' };
    html.style.fontSize = sizeMap[acc.textSize] || sizeMap.normal;

    // High contrast
    html.classList.toggle('ks-high-contrast', !!acc.highContrast);

    // Reduce motion
    html.classList.toggle('ks-reduce-motion', !!acc.reduceMotion);
  }, [acc.textSize, acc.highContrast, acc.reduceMotion]);
}