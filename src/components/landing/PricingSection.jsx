import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { FAMILY_LINE, LANDING_PLANS, PRICING_FINE_PRINT } from '@/lib/landingPlans';

export default function PricingSection() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="mx-auto w-full max-w-[1100px] px-5 py-16 md:py-20">
      <div className="max-w-[38rem]">
        <h2 id="pricing-heading" className="font-display text-[1.75rem] font-semibold leading-tight sm:text-4xl">
          Simple pricing, no surprises
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Start with 7 days free. Pick Basic or Premium, pay yearly, or own it outright for life.
          Either way, there are no ads and you can cancel in a tap.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {LANDING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-3xl border bg-card p-5 shadow-card md:p-6 ${
              plan.highlight ? 'border-primary ring-1 ring-primary' : 'border-border'
            }`}
          >
            {plan.highlight && (
              <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                <Sparkles size={12} aria-hidden="true" /> Most loved
              </span>
            )}

            <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">{plan.tagline}</p>

            <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-display text-[2rem] font-semibold leading-none">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              or {plan.lifetime}, one time
            </p>

            <ul className="mt-4 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13.5px] leading-snug">
                  <Check size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className={`mt-5 inline-flex min-h-[46px] items-center justify-center rounded-full px-6 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                plan.highlight
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'border border-foreground text-foreground hover:bg-foreground hover:text-background'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
        {FAMILY_LINE}
      </p>
      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{PRICING_FINE_PRINT}</p>
    </section>
  );
}