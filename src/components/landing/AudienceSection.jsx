import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Flame, HandHeart, Heart } from 'lucide-react';

// Recognition before explanation: a visitor converts on seeing their own week
// described, not on a feature list. Three doorways — one per real job the app
// does — each opening on that person's Tuesday and ending in the same trial.
const AUDIENCES = [
  {
    Icon: Heart,
    eyebrow: 'For a partner',
    title: 'You’d rather be the one who remembers',
    body: 'The date night that keeps getting postponed, the hard day nobody asked about, the thank-you you meant to say last week.',
    points: ['Plan the next thing, not the last', 'Keep the moments you’d otherwise forget'],
    cta: 'Start with your partner',
  },
  {
    Icon: HandHeart,
    eyebrow: 'For a parent you look after',
    title: 'You’re holding a lot of small details',
    body: 'Appointments, refills, the grandchildren’s birthdays — and the question underneath all of it: did anyone call her today?',
    points: ['Care check-ins on a rhythm you set', 'Their dates, notes and details in one place'],
    cta: 'Start with your parent',
  },
  {
    Icon: Flame,
    eyebrow: 'For someone you’re remembering',
    title: 'You don’t want the day to pass unnoticed',
    body: 'One date a year, kept quietly: the photos, the stories, the reason you still say their name out loud.',
    points: ['A yearly remembrance nudge, not a birthday', 'A private place for their photos and notes'],
    cta: 'Start remembering them',
  },
];

export default function AudienceSection() {
  return (
    <section aria-labelledby="audience-heading" className="mx-auto w-full max-w-[1100px] px-5 py-16 md:py-20">
      <div className="max-w-[36rem]">
        <h2 id="audience-heading" className="font-display text-[1.75rem] font-semibold leading-tight sm:text-4xl">
          Which one is you?
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Most people arrive here for one of three reasons. Find yours.
        </p>
      </div>

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {AUDIENCES.map(({ Icon, eyebrow, title, body, points, cta }) => (
          <li
            key={eyebrow}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon size={18} aria-hidden="true" />
            </span>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {eyebrow}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>

            <ul className="mt-3 flex-1 space-y-1.5">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-[13px] leading-snug">
                  <Check size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-foreground px-4 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {cta}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}