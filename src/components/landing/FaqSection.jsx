import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// The six questions that stop someone signing up. Each answer is plain and
// specific — a vague answer here reads as a hidden catch.
const FAQS = [
  {
    q: 'Is FinBump just another calendar?',
    a: 'No. A calendar tells you a birthday is coming. FinBump also holds the small things: the check-in that’s overdue, the thank-you you meant to send, the question to ask tonight. Dates live here too — they’re just not the whole point.',
  },
  {
    q: 'Will it nag me?',
    a: 'You get one clear thing when it is actually due, not a wall of alerts. Quiet hours are yours to set, every reminder has its own switch, and anything you turn off stays off.',
  },
  {
    q: 'Who can see my notes and photos?',
    a: 'Only you, and anyone you deliberately invite. Photos are stored privately and shown through links that expire, and nothing is sold or used to train anyone else’s models.',
  },
  {
    q: 'Do I need a partner to use it?',
    a: 'Not at all. It works for a parent, a sibling, a friend, a pet — or just for you, keeping the moments you want to remember.',
  },
  {
    q: 'What happens after the 7-day trial?',
    a: 'The plan you chose starts on day 8. Cancel in a tap before then and you pay nothing — no email, no phone call, no retention chat.',
  },
  {
    q: 'Can I take my data with me?',
    a: 'Yes. Export everything from Settings, or close your account there too. Nothing you write here is held hostage.',
  },
];

export default function FaqSection() {
  return (
    <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-[1100px] px-5 py-16 md:py-20">
      <div className="max-w-[36rem]">
        <h2 id="faq-heading" className="font-display text-[1.75rem] font-semibold leading-tight sm:text-4xl">
          Fair questions
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          What people ask before they hand over their memories.
        </p>
      </div>

      <Accordion type="single" collapsible className="mt-8 rounded-2xl border border-border bg-card px-5 shadow-card">
        {FAQS.map(({ q, a }, index) => (
          <AccordionItem key={q} value={`faq-${index}`} className="border-border last:border-b-0">
            <AccordionTrigger className="py-4 text-left font-display text-[15.5px] font-semibold leading-snug hover:no-underline">
              {q}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-[13.5px] leading-relaxed text-muted-foreground">
              {a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}