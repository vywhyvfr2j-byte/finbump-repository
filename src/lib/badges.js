import { Award, BadgeCheck, Flame, Footprints, HeartHandshake, MoonStar, Sparkles, UserPlus, Users } from 'lucide-react';

// Badge catalog — the member-facing copy. The award rules live server-side in
// base44/shared/badgeCatalog.ts; this file only decides how a badge looks and
// what it says. `target` is repeated here so a locked badge can show honest
// progress ("3 of 5"), and must stay in step with the server catalog.
//
// Tone rules: a badge is a small record of something real, never a score. No
// points, no streaks, no ranking between members.

export const SHELVES = [
  { id: 'beginnings', label: 'Beginnings' },
  { id: 'evenings', label: 'Kept evenings' },
  { id: 'circle', label: 'Your circle' },
  { id: 'membership', label: 'Membership' },
];

export const BADGES = [
  {
    id: 'first_person',
    shelf: 'beginnings',
    name: 'First connection',
    line: 'You started keeping someone in mind.',
    how: 'Add someone you care about',
    target: 1,
    unit: 'person',
    Icon: UserPlus,
  },
  {
    id: 'first_act',
    shelf: 'beginnings',
    name: 'First kindness',
    line: 'The first small thing you did for someone.',
    how: 'Complete an act of support',
    target: 1,
    unit: 'act',
    Icon: HeartHandshake,
  },
  {
    id: 'first_memory',
    shelf: 'beginnings',
    name: 'First evening kept',
    line: 'One moment saved for later.',
    how: 'Answer the evening memory question',
    target: 1,
    unit: 'moment',
    Icon: MoonStar,
  },
  {
    id: 'evenings_7',
    shelf: 'evenings',
    name: 'Seven evenings',
    line: 'A week of moments, kept.',
    how: 'Keep 7 memory moments',
    target: 7,
    unit: 'moments',
    Icon: Sparkles,
  },
  {
    id: 'evenings_30',
    shelf: 'evenings',
    name: 'Thirty evenings',
    line: 'A month of days worth remembering.',
    how: 'Keep 30 memory moments',
    target: 30,
    unit: 'moments',
    Icon: Flame,
  },
  {
    id: 'circle_five',
    shelf: 'circle',
    name: 'A circle of five',
    line: 'Five people you keep close.',
    how: 'Add 5 people',
    target: 5,
    unit: 'people',
    Icon: Users,
  },
  {
    id: 'little_steps_seven',
    shelf: 'beginnings',
    name: 'Little Steps',
    line: 'You walked the whole first series.',
    how: 'Open all 7 Little Steps lessons',
    target: 7,
    unit: 'lessons',
    Icon: Footprints,
  },
  {
    id: 'founding_member',
    shelf: 'membership',
    name: 'Founding member',
    line: 'Here from the beginning.',
    how: 'A founding-member number is issued to you',
    target: 1,
    unit: '',
    Icon: Award,
  },
  {
    id: 'supporter',
    shelf: 'membership',
    name: 'Supporter',
    line: 'You keep FinBump going.',
    how: 'Hold a Premium plan',
    target: 1,
    unit: '',
    Icon: BadgeCheck,
  },
];

export const BADGE_COUNT = BADGES.length;

export function badgeById(id) {
  return BADGES.find((badge) => badge.id === id) || null;
}