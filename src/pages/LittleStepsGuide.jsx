import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LITTLE_STEPS } from '@/lib/littleSteps';

// A printable sheet of the whole Little Steps series: one block per lesson with
// its steps and its hands-on step, so the list can be printed and kept
// somewhere visible. Built from LITTLE_STEPS, so it can never drift from what
// the app actually teaches.
export default function LittleStepsGuide() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-2xl mx-auto px-5 pt-5 pb-24">
        <div className="flex items-center justify-between gap-3 mb-4" data-print-hide>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} /> Settings
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()} data-print-hide>
            <Printer size={16} className="mr-1.5" /> Print this list
          </Button>
        </div>

        <div className="ks-print-area">
          <header className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">FinBump</p>
            <h1 className="font-display text-3xl font-semibold mt-1">Little Steps</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Ten hands-on lessons across your first three months. Take them in order, one at a
              time, and do the one thing at the bottom of each. FinBump ticks a lesson off by
              itself once the step has been saved, so there is nothing to mark done.
            </p>
          </header>

          <div className="space-y-3">
            {LITTLE_STEPS.map((lesson) => (
              <section
                key={lesson.day}
                className="ks-print-lesson rounded-2xl border border-border bg-card p-4"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                  Day {lesson.day}
                </p>
                <h2 className="font-display text-lg font-semibold mt-0.5">{lesson.title}</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{lesson.body}</p>
                <ol className="mt-2.5 space-y-1.5">
                  {lesson.steps.map((step, i) => (
                    <li key={step} className="flex gap-2 text-sm leading-snug">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[11px] font-semibold shrink-0">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-xs font-medium text-primary mt-2.5">
                  Hands-on step: {lesson.practice.label}
                </p>
              </section>
            ))}
          </div>

          <footer className="mt-5 text-xs text-muted-foreground leading-relaxed">
            The lessons arrive on Home and by email on days 1, 2, 3, 5, 7, 14, 30, 45, 60 and 90.
            You can turn the lesson emails off, or go through the series again, in Settings.
            <br />
            finbump-memory.base44.app
          </footer>
        </div>
      </div>
    </div>
  );
}