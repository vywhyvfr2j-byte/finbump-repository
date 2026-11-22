import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '@/components/BrandLogo';
import FeatureGroup from '@/components/landing/FeatureGroup';
import { FEATURE_GROUPS } from '@/lib/content/featuresPage';

// Public features page — reachable without an account (see src/App.jsx) so it can
// be linked from the landing page, a website, or anywhere else people find FinBump.
export default function Features() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'FinBump features — every part of the app, explained';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-5 pt-[calc(14px+env(safe-area-inset-top))] pb-3">
        <Link to="/welcome" className="flex items-center gap-2" aria-label="FinBump home">
          <BrandLogo size={32} />
          <span className="font-display text-lg font-semibold leading-none">FinBump</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <a
            href="#pricing"
            className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Pricing
          </a>
          <Link
            to="/login"
            className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main id="main-content">
        <section className="mx-auto w-full max-w-[1100px] px-5 pb-10 pt-8 md:pt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            C.A.R.E. — Connections, Acts, Reminders, Events
          </p>
          <h1 className="mt-3 max-w-[40rem] font-display text-[2rem] font-semibold leading-[1.1] sm:text-5xl">
            Every part of FinBump, and exactly how it works
          </h1>
          <p className="mt-4 max-w-[38rem] text-[15px] leading-relaxed text-muted-foreground">
            FinBump is a memory vault and a care reminder for the people you love. Below is every
            feature in the app, in plain language — what it is for and what actually happens when you
            use it.
          </p>

          <nav aria-label="Jump to a feature group" className="mt-6 flex flex-wrap gap-2">
            {FEATURE_GROUPS.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {group.title}
              </a>
            ))}
          </nav>
        </section>

        {FEATURE_GROUPS.map((group) => (
          <FeatureGroup key={group.id} {...group} />
        ))}

        <section id="pricing" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto w-full max-w-[1100px] px-5 py-14 text-center md:py-20">
            <h2 className="font-display text-[1.5rem] font-semibold leading-tight sm:text-3xl">
              Start with seven days, free
            </h2>
            <p className="mx-auto mt-3 max-w-[34rem] text-[14px] leading-relaxed text-muted-foreground">
              Your people, your acts, your reminders, your calendar, your cards and your notes are
              yours from day one. Premium adds the AI helpers, planning for meals and trips, Year in
              Moments and Remembrance.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                Create your account
              </Link>
              <Link
                to="/welcome"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
              >
                See plans and pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 px-5 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo size={24} />
            <span className="text-[13px] text-muted-foreground">
              FinBump — never forget to show up.
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            <Link to="/welcome" className="hover:text-foreground">Home</Link>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link to="/register" className="hover:text-foreground">Create account</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}