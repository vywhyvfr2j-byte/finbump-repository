import React from 'react';

// One feature on the public features page: what it is for, then how it behaves.
export default function FeatureCard({ Icon, name, what, how, premium }) {
  return (
    <li className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-card">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={18} aria-hidden="true" />
      </span>

      <h3 className="mt-3 flex flex-wrap items-center gap-2 font-display text-base font-semibold">
        {name}
        {premium && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
            Premium
          </span>
        )}
      </h3>

      <p className="mt-1 text-[13px] leading-relaxed text-foreground/80">{what}</p>

      <p className="mt-3 border-t border-border pt-3 text-[13px] leading-relaxed text-muted-foreground">
        {how}
      </p>
    </li>
  );
}