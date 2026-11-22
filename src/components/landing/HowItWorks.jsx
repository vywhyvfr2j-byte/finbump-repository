import React from 'react';

const STEPS = [
  {
    n: '1',
    title: 'Add the people you love',
    body: 'A name and a birthday is enough to start. Add the details you want to remember as you go.',
  },
  {
    n: '2',
    title: 'Get one nudge when it is due',
    body: 'A check-in, a thank-you, a date coming up. One clear thing to do, never a wall of alerts.',
  },
  {
    n: '3',
    title: 'Keep the little things',
    body: 'Answer the evening question. Over a year it becomes a record of the life you actually lived.',
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-y border-border bg-muted/40">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-16 md:py-20">
        <h2 id="how-heading" className="font-display text-[1.75rem] font-semibold leading-tight sm:text-4xl">
          Three small steps, one quieter week
        </h2>

        <ol className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="font-display text-3xl font-semibold text-primary" aria-hidden="true">
                {step.n}
              </span>
              <h3 className="mt-1 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}