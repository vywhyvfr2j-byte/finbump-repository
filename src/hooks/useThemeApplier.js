import { useEffect } from 'react';
import { getThemeById } from '@/lib/themes';

// CSS custom properties managed by the theme system — cleared before each
// re-application so switching themes never leaves stale overrides behind.
const THEME_KEYS = [
  '--primary', '--accent', '--background', '--card', '--popover',
  '--secondary', '--muted', '--border', '--input', '--ring',
];

// Boundary tokens that high contrast mode re-inks. The theme writes these as
// inline styles on <html>, and inline styles beat every class rule, so a rule
// in index.css can never strengthen them — this hook is the only place that can.
const BOUNDARY_KEYS = ['--border', '--input'];

// Applies the user's chosen color theme app-wide by overriding CSS custom
// properties on <html> and updating the brand gradient stops that every
// lucide icon references. Re-applies automatically when dark mode toggles and
// when high contrast mode is switched on or off (both toggle a class on <html>,
// which the observer below catches).
export function useThemeApplier(themeId) {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const theme = getThemeById(themeId);
      const isDark = root.classList.contains('dark');
      const highContrast = root.classList.contains('ks-high-contrast');
      const tokens = isDark ? theme.dark : theme.light;

      THEME_KEYS.forEach((key) => root.style.removeProperty(key));
      Object.entries(tokens).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });

      // High contrast: boundaries reuse the text color, which the design system
      // already guarantees clears AA against the surface, so every border and
      // field outline clears the 3:1 that WCAG 1.4.11 asks of boundaries.
      if (highContrast) {
        const ink = getComputedStyle(root).getPropertyValue('--foreground').trim();
        if (ink) BOUNDARY_KEYS.forEach((key) => root.style.setProperty(key, ink));
      }

      const stops = document.querySelectorAll('#finbump-gradient stop');
      theme.gradient.forEach((color, i) => {
        stops[i]?.setAttribute('stopColor', color);
      });
    };

    apply();

    // Re-apply when the .dark class toggles (system color-scheme change).
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [themeId]);
}