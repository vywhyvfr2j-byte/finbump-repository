import React from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ACT_TEMPLATES } from '@/components/acts/ActTemplates';

// Onboarding's "first act of kindness" step. It teaches the idea in one screen
// using the same building blocks as the Acts page — a template, who it's for,
// and how often — pre-filled so the new user can accept it with one tap.
//
// A short, curated slice of the real templates keeps the step to a single
// screen on a phone; every one still comes from ACT_TEMPLATES.
const FEATURED_ACT_NAMES = [
  'Ask about their day',
  'Check in by text',
  'Give a sincere compliment',
  'Write a handwritten note',
  'Cook their favorite meal',
  'Plan a date night',
];

const FEATURED_ACTS = FEATURED_ACT_NAMES
  .map((name) => ACT_TEMPLATES.find((t) => t.name === name))
  .filter(Boolean);

// Cadence choices, in the same shape the Acts page uses (interval in days).
const CADENCES = [
  { key: 'daily', label: 'Every day', intervalDays: 1 },
  { key: 'weekly', label: 'Every week', intervalDays: 7 },
  { key: 'monthly', label: 'Every month', intervalDays: 30 },
];

const tagForDays = (days) => (days <= 1 ? 'daily' : days <= 7 ? 'weekly' : 'monthly');

const nearestCadence = (days) => {
  const n = Number(days) || 7;
  if (n <= 1) return 1;
  if (n <= 7) return 7;
  return 30;
};

// Defaults offered in the step: the first act, for nobody in particular yet
// (the parent pre-selects the first person named once people exist).
export const DEFAULT_ACT_SETUP = {
  templateName: 'Ask about their day',
  customName: '',
  whoName: '',
  intervalDays: 1,
};

// Turns the step's choices into the act payload the store creates when setup
// finishes. `peopleNames` is the ordered list of people the user named, so the
// chosen person can be linked by name — their records only exist on finish.
// `personIndex` is the position of that person (or -1 for everyone).
export function buildStarterAct(value, peopleNames = []) {
  const custom = value.customName.trim();
  const name = (custom || value.templateName).trim();
  if (!name) return null;
  const tpl = ACT_TEMPLATES.find((t) => t.name === value.templateName);
  const intervalDays = nearestCadence(value.intervalDays);
  const personIndex = value.whoName ? peopleNames.findIndex((n) => n === value.whoName) : -1;
  return {
    name,
    emoji: custom ? '✨' : (tpl?.emoji || '✨'),
    tag: tagForDays(intervalDays),
    intervalDays,
    category: 'act',
    repeat: true,
    nextDue: null,
    notify: true,
    personIndex: personIndex >= 0 ? personIndex : -1,
  };
}

const chipClass = (selected) =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    selected ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground'
  }`;

export default function FirstActSetup({ people = [], value, onChange }) {
  const custom = value.customName.trim();
  const tpl = ACT_TEMPLATES.find((t) => t.name === value.templateName);
  const actName = custom || value.templateName;
  const emoji = custom ? '✨' : (tpl?.emoji || '✨');
  const intervalDays = nearestCadence(value.intervalDays);
  const cadence = CADENCES.find((c) => c.intervalDays === intervalDays) || CADENCES[1];
  const who = value.whoName || 'everyone';

  const pickTemplate = (picked) =>
    onChange({ templateName: picked.name, customName: '', intervalDays: nearestCadence(picked.intervalDays) });

  return (
    <div className="px-2">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
        className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center"
      >
        <HeartHandshake size={26} className="text-primary" />
      </motion.div>
      <h2 className="font-display text-2xl font-semibold mb-2 text-center">
        Set up your first act of kindness
      </h2>
      <p className="text-muted-foreground text-sm text-center mb-5 px-1">
        An act of kindness is a small thing you do on purpose for someone — a
        text, a compliment, a meal. FinBump reminds you when it&apos;s been a
        while, so it never slips your mind.
      </p>

      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pick an act</label>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {FEATURED_ACTS.map((option) => (
          <button
            key={option.name}
            type="button"
            onClick={() => pickTemplate(option)}
            className={chipClass(!custom && value.templateName === option.name)}
          >
            <span className="mr-1">{option.emoji}</span>
            {option.name}
          </button>
        ))}
      </div>
      <Input
        value={value.customName}
        onChange={(e) => onChange({ customName: e.target.value })}
        placeholder="Or write your own — e.g. Call my mom on Sundays"
        className="h-11 text-base"
      />

      {people.length > 0 && (
        <>
          <label className="text-xs font-medium text-muted-foreground mt-4 mb-1.5 block">
            Who is it for?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {people.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onChange({ whoName: name })}
                className={chipClass(value.whoName === name)}
              >
                {name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onChange({ whoName: '' })}
              className={chipClass(!value.whoName)}
            >
              Everyone
            </button>
          </div>
        </>
      )}

      <label className="text-xs font-medium text-muted-foreground mt-4 mb-1.5 block">
        How often should we remind you?
      </label>
      <div className="flex flex-wrap gap-1.5">
        {CADENCES.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange({ intervalDays: option.intervalDays })}
            className={chipClass(intervalDays === option.intervalDays)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {actName && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-3.5">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Your first act</p>
          <p className="text-sm font-semibold">
            <span className="mr-1.5">{emoji}</span>
            {actName}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            For {who} · {cadence.label.toLowerCase()} — this shows up on your home
            screen as soon as setup finishes.
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
        You can add more acts, change the timing, or remove this one anytime on
        your Acts page.
      </p>
    </div>
  );
}