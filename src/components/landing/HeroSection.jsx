import React from 'react';
import { Link } from 'react-router-dom';
import { Ban, Check, ShieldCheck, Smartphone, Undo2 } from 'lucide-react';
import './landing.css';

// The promise, then the proof points. Replaces the mockup's partner logos: this
// app has no partners to name, but these five are what a cautious first-time
// visitor actually wants to know before signing up.
const TRUST = [
  { Icon: Check, label: '7-day free trial' },
  { Icon: Ban, label: 'No ads, ever' },
  { Icon: ShieldCheck, label: 'Private by default' },
  { Icon: Smartphone, label: 'iPhone · Android · Web' },
  { Icon: Undo2, label: 'Cancel anytime' },
];

export default function HeroSection() {
  return (
    <section className="ks-hero" aria-label="FinBump">
      <div className="ks-hero-bloom" aria-hidden="true" />
      <div className="ks-hero-ripple" aria-hidden="true" />

      <div className="ks-hero-text mx-auto w-full max-w-[1100px] px-5 pt-14 pb-10 text-center md:pt-20">
        <p
          className="ks-hero-rise text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
          style={{ animationDelay: '0s' }}
        >
          A keepsake for the little things
        </p>

        <h1
          className="ks-hero-rise mt-3 font-display text-[2.15rem] font-semibold leading-[1.08] tracking-[-0.015em] text-foreground sm:text-5xl md:text-[3.9rem]"
          style={{ animationDelay: '0.06s' }}
        >
          Never forget to show up
          <br className="hidden sm:inline" /> for the people you love
        </h1>

        <p
          className="ks-hero-rise mx-auto mt-5 max-w-[38rem] text-[15px] leading-relaxed text-muted-foreground md:text-base"
          style={{ animationDelay: '0.14s' }}
        >
          FinBump holds the birthdays and check-ins, the thank-yous and the hard days, and one small
          memory from each evening. Gentle reminders, thoughtful help, and no noise.
        </p>

        <div
          className="ks-hero-rise mt-8 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: '0.22s' }}
        >
          <Link
            to="/register"
            className="inline-flex min-h-[48px] min-w-[190px] items-center justify-center rounded-full border border-foreground bg-foreground px-7 text-sm font-medium text-background transition-colors hover:bg-transparent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Start your free trial
          </Link>
          <a
            href="#pricing"
            className="inline-flex min-h-[48px] min-w-[190px] items-center justify-center rounded-full border border-foreground bg-transparent px-7 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            See pricing
          </a>
        </div>
      </div>

      <div className="ks-hero-strip mx-auto w-full max-w-[1100px] px-5 pb-12 pt-6 md:pb-16 md:pt-14">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 md:justify-between">
          {TRUST.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[13px] md:text-sm">
              <Icon size={16} className="shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}