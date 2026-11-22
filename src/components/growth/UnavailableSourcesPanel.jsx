import React from 'react';
import { Smartphone, Megaphone } from 'lucide-react';

const SOURCES = [
  {
    Icon: Smartphone,
    label: 'App installs',
    detail: 'Install counts stay with Apple (App Store Connect) and Google Play. The app never receives them, so there is nothing here to chart yet.',
  },
  {
    Icon: Megaphone,
    label: 'Ad costs',
    detail: 'Campaigns and their spend live in Marketing → Google Ads. That reporting stays there and is not stored in the app.',
  },
];

export default function UnavailableSourcesPanel() {
  return (
    <section className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
      <h2 className="font-display text-base font-semibold">Installs and ad costs</h2>
      <p className="mt-1 text-[11px] text-muted-foreground">
        No data from these has been synced into the app, so they are left out rather than shown as zero.
      </p>
      <ul className="mt-3 space-y-3">
        {SOURCES.map(({ Icon, label, detail }) => (
          <li key={label} className="flex gap-2.5">
            <Icon className="mt-0.5 w-4 h-4 shrink-0 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{label}</p>
                <span className="rounded-full bg-card px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  No source
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}