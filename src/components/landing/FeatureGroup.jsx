import React from 'react';
import FeatureCard from '@/components/landing/FeatureCard';

// One titled block of features on the public features page. `tinted` alternates
// the band colour so long stretches of cards stay readable.
export default function FeatureGroup({ id, title, intro, items, tinted }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-20 ${tinted ? 'border-y border-border bg-muted/40' : ''}`}
    >
      <div className="mx-auto w-full max-w-[1100px] px-5 py-12 md:py-16">
        <h2 id={`${id}-heading`} className="font-display text-[1.5rem] font-semibold leading-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-[38rem] text-[14px] leading-relaxed text-muted-foreground">{intro}</p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <FeatureCard key={item.name} {...item} />
          ))}
        </ul>
      </div>
    </section>
  );
}