import React from 'react';
import { Lock, ShieldCheck, Undo2 } from 'lucide-react';

const POINTS = [
  {
    Icon: Lock,
    title: 'Your memories stay yours',
    body: 'Photos and notes are stored privately and shown only to you and the people you invite.',
  },
  {
    Icon: ShieldCheck,
    title: 'Nothing is sold, ever',
    body: 'No ads, no data brokers, no training on your memories. You are the customer, not the product.',
  },
  {
    Icon: Undo2,
    title: 'Leave whenever you want',
    body: 'Export your data or close your account from Settings. Cancel a plan without an email or a phone call.',
  },
];

export default function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="border-t border-border bg-muted/40">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-16 md:py-20">
        <h2 id="trust-heading" className="font-display text-[1.75rem] font-semibold leading-tight sm:text-4xl">
          Built to be trusted with the tender stuff
        </h2>

        <ul className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
          {POINTS.map(({ Icon, title, body }) => (
            <li key={title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/25 text-secondary-foreground">
                <Icon size={18} aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}