import React from 'react';
import { CalendarDays, Gift, HandHeart, Heart, Moon, Users } from 'lucide-react';
import { Image } from '@/components/ui/image';

const PILLARS = [
  { Icon: Heart, title: 'Acts of support', body: 'The call, the check-in, the thank-you — set once, nudged when it is due.' },
  { Icon: Users, title: 'People & pets', body: 'Birthdays, sizes, favorite flowers: the details that make someone feel known.' },
  { Icon: Moon, title: 'Evening memories', body: 'One gentle question each night. Two lines kept is a moment saved.' },
  { Icon: Gift, title: 'Gifts that land', body: 'Ideas, budgets and what you already gave, so nothing is a guess.' },
  { Icon: CalendarDays, title: 'Dates & countdowns', body: 'Occasions, anniversaries and the next thing coming, all in one place.' },
  { Icon: HandHeart, title: 'Remembrance', body: 'A yearly date to remember someone, kept quietly and privately.' },
];

const PHOTOS = [
  {
    src: 'https://media.base44.com/images/public/6a51288bdcecc77c014539fd/7b049a9c8_generated_image.png',
    caption: 'For the people who raised you, and the ones you are raising.',
  },
  {
    src: 'https://media.base44.com/images/public/6a51288bdcecc77c014539fd/38c29a364_generated_image.png',
    caption: 'For the friendships that quietly hold everything else up.',
  },
];

export default function ValueSection() {
  return (
    <section aria-labelledby="value-heading" className="mx-auto w-full max-w-[1100px] px-5 py-16 md:py-20">
      <div className="max-w-[36rem]">
        <h2 id="value-heading" className="font-display text-[1.75rem] font-semibold leading-tight sm:text-4xl">
          The little things are the big things
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Most of what makes a relationship feel strong is small, unglamorous and easy to forget.
          FinBump keeps it where you can see it.
        </p>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {PILLARS.map(({ Icon, title, body }) => (
          <li key={title} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon size={18} aria-hidden="true" />
            </span>
            <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {PHOTOS.map((photo) => (
          <figure key={photo.src} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <Image
              src={photo.src}
              alt={photo.caption}
              fittingType="fill"
              className="h-[220px] w-full object-cover sm:h-[260px]"
            />
            <figcaption className="px-4 py-3 text-[13px] leading-snug text-muted-foreground">
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}