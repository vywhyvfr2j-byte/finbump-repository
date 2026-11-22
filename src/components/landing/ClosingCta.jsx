import React from 'react';
import { Link } from 'react-router-dom';

export default function ClosingCta() {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-5 py-16 md:py-20">
      <div className="rounded-3xl bg-foreground px-6 py-10 text-center md:px-10 md:py-14">
        <h2 className="font-display text-[1.6rem] font-semibold leading-tight text-background sm:text-3xl">
          Start with tonight&rsquo;s memory
        </h2>
        <p className="mx-auto mt-3 max-w-[32rem] text-[15px] leading-relaxed text-background/85">
          One question, two lines, a moment kept. The rest of FinBump is here when you need it — free
          for seven days.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex min-h-[48px] min-w-[190px] items-center justify-center rounded-full bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Create your account
          </Link>
          <Link
            to="/login"
            className="inline-flex min-h-[48px] min-w-[190px] items-center justify-center rounded-full border border-background px-7 text-sm font-medium text-background transition-colors hover:bg-background/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}