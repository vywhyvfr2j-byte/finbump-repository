import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '@/components/BrandLogo';
import HeroSection from '@/components/landing/HeroSection';
import AudienceSection from '@/components/landing/AudienceSection';
import ValueSection from '@/components/landing/ValueSection';
import HowItWorks from '@/components/landing/HowItWorks';
import PricingSection from '@/components/landing/PricingSection';
import TrustSection from '@/components/landing/TrustSection';
import FaqSection from '@/components/landing/FaqSection';
import ClosingCta from '@/components/landing/ClosingCta';

// Public front door for people who don't have an account yet. Reachable without
// signing in (see src/App.jsx), and the destination for a logged-out visit to "/".
export default function Welcome() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-5 pt-[calc(14px+env(safe-area-inset-top))] pb-3">
        <Link to="/welcome" className="flex items-center gap-2" aria-label="FinBump home">
          <BrandLogo size={32} />
          <span className="font-display text-lg font-semibold leading-none">FinBump</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Link
            to="/features"
            className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Features
          </Link>
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
        <HeroSection />
        {/* Recognition first: the three reasons people arrive, before features. */}
        <AudienceSection />
        <ValueSection />
        <HowItWorks />
        <PricingSection />
        <TrustSection />
        <FaqSection />
        <ClosingCta />
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
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link to="/register" className="hover:text-foreground">Create account</Link>
            <Link to="/me" className="hover:text-foreground">Account details</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}