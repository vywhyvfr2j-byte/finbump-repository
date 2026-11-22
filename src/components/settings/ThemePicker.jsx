import React from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { THEMES, THEME_CATEGORIES } from '@/lib/themes';
import { ThemeIcon } from '@/components/SeasonalIcon';
import { useI18n } from '@/lib/i18n/I18nContext';

// Per-user color theme picker — saves to settings.theme and applies app-wide
// via useThemeApplier. Each swatch previews the theme's gradient and label.
export default function ThemePicker() {
  const { settings, updateSettings } = useKeepsake();
  const { t } = useI18n();
  const current = settings.theme || 'default';

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div>
        <p className="text-sm font-medium">Color theme</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pick a scheme that fits your style, season, holiday, or team — colors and icons update everywhere.
        </p>
      </div>
      {THEME_CATEGORIES.map((cat) => {
        const themes = THEMES.filter((t) => t.category === cat);
        if (!themes.length) return null;
        return (
          <div key={cat}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => {
                const selected = current === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => updateSettings({ theme: theme.id })}
                    className={`relative rounded-xl p-2 text-left transition-all ${
                      selected ? 'border-2 border-primary' : 'border border-border'
                    }`}
                  >
                    <div
                      className="h-8 w-full rounded-lg mb-1.5"
                      style={{
                        background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]}, ${theme.gradient[2]})`,
                      }}
                    />
                    <p className="text-[11px] font-medium leading-tight flex items-center gap-1.5">
                      <ThemeIcon themeId={theme.id} size={16} />
                      {theme.id === 'default' ? t('app.name') : theme.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}