import React from 'react';
import TopNav from '@/components/TopNav';

// Shared renderer for the Privacy Policy and Terms pages. Both documents use
// the same shape (intro + numbered sections, each with a paragraph and/or a
// bullet list), so one component keeps them consistent and readable.
export default function LegalDocument({ title, intro, lastUpdated, sections = [] }) {
  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-16">
      <TopNav title={title} back />
      <article className="px-5 mt-2 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">{lastUpdated}</p>
        <p>{intro}</p>
        {sections.map((section) => (
          <section key={section.h} className="space-y-2">
            <h2 className="font-display text-base font-semibold">{section.h}</h2>
            {section.p && <p>{section.p}</p>}
            {section.list && (
              <ul className="list-disc pl-5 space-y-1.5">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}