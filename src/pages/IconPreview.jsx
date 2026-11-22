import React from 'react';
import TopNav from '@/components/TopNav';
import FbIcon from '@/components/icons/FbIcon';
import IconCompareRow from '@/components/icons/IconCompareRow';
import IconSetGallery from '@/components/icons/IconSetGallery';
import { PRIMARY_TABS, NAV_ITEMS } from '@/lib/navItems';
import { Pencil, Trash2, Check, CalendarClock, Bell, History as HistoryIcon, Clock, Sparkles } from 'lucide-react';

// Admin review screen for the new FinBump icon pack: the icon in use today
// next to the pack's colour and mono versions, in the places they would land.
// Nothing in the app uses the pack until this has been reviewed and agreed.
const ACTION_ICONS = [
  { label: 'Edit an act', fbIcon: 'edit', Current: Pencil },
  { label: 'Delete', fbIcon: 'delete', Current: Trash2 },
  { label: 'Mark complete', fbIcon: 'mark-complete', Current: Check },
  { label: 'Reschedule', fbIcon: 'reschedule', Current: CalendarClock },
  { label: 'Notifications', fbIcon: 'notification', Current: Bell },
  { label: 'Completion history', fbIcon: 'completion-history', Current: HistoryIcon },
  { label: 'Timeline', fbIcon: 'timeline', Current: Clock },
  { label: 'Ask for help', fbIcon: 'ask-for-help', Current: Sparkles },
];

const LEGEND = (
  <div className="flex items-center gap-2 px-3 mb-1.5">
    <span className="w-[6.5rem] shrink-0" />
    <div className="flex items-center gap-2 text-[9px] uppercase tracking-wide text-muted-foreground">
      <span className="w-10 text-center">today</span>
      <span className="w-10 text-center">colour</span>
      <span className="w-10 text-center">mono</span>
    </div>
  </div>
);

export default function IconPreview() {
  const navRows = NAV_ITEMS.filter((item) => item.fbIcon);

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title="New icon set" subtitle="Review" back />

      <div className="px-5 mt-2 space-y-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The new pack replaces the line icons across the app. Each icon comes in two styles: the
          full-colour artwork, and a single-tone version that follows your theme colour (and dark
          mode). Nothing switches over until you say so.
        </p>

        <section>
          <h2 className="font-display text-base font-semibold mb-1.5">Bottom bar</h2>
          {LEGEND}
          <div className="space-y-2">
            {PRIMARY_TABS.filter((tab) => tab.fbIcon).map((tab) => (
              <IconCompareRow key={tab.to} label={tab.label} Current={tab.icon} fbIcon={tab.fbIcon} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-base font-semibold mb-1.5">Explore tiles &amp; menus</h2>
          {LEGEND}
          <div className="space-y-2">
            {navRows.map((item) => (
              <IconCompareRow key={item.to} label={item.label} Current={item.Icon} fbIcon={item.fbIcon} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-base font-semibold mb-1.5">Row actions</h2>
          {LEGEND}
          <div className="space-y-2">
            {ACTION_ICONS.map((item) => (
              <IconCompareRow key={item.label} label={item.label} Current={item.Current} fbIcon={item.fbIcon} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-base font-semibold mb-1.5">The full set</h2>
          <p className="text-xs text-muted-foreground mb-2">All 34 icons, colour and mono.</p>
          <IconSetGallery />
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-base font-semibold mb-1.5">One thing to decide</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The pack is drawn in its own blue and sea-green palette. The app's own theme is warm —
            coral, teal and gold — so the colour icons will read as a new accent colour, while the
            mono icons pick up the theme colour wherever they sit.
          </p>
        </section>
      </div>
    </div>
  );
}