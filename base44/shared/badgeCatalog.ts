// Badge catalog — the server's copy.
//
// A badge is earned, never chosen: the catalog lives in code, so no client can
// insert its own badge id and no record has to be trusted for its meaning. This
// file holds only what the award check needs (which measured value, and the
// threshold); the words and icons a member sees live in src/lib/badges.js.
//
// `metric` keys are the values award-badges measures for the signed-in member:
//   people        how many connections they keep
//   acts          how many acts of support they have completed
//   memories      how many evening memory moments they have kept
//   littleSteps   how many Little Steps lessons they have opened and acted on
//   memberNumber  1 once a founding-member number is issued
//   paidPurchase  1 while they hold a paid plan
//
// Badges are cumulative, never streaky: nothing is taken away for a quiet week.

export type BadgeShelf = 'beginnings' | 'evenings' | 'circle' | 'membership';

export interface BadgeDefinition {
  id: string;
  shelf: BadgeShelf;
  metric: 'people' | 'acts' | 'memories' | 'littleSteps' | 'memberNumber' | 'paidPurchase';
  target: number;
}

export const BADGES: BadgeDefinition[] = [
  { id: 'first_person', shelf: 'beginnings', metric: 'people', target: 1 },
  { id: 'first_act', shelf: 'beginnings', metric: 'acts', target: 1 },
  { id: 'first_memory', shelf: 'beginnings', metric: 'memories', target: 1 },
  { id: 'evenings_7', shelf: 'evenings', metric: 'memories', target: 7 },
  { id: 'evenings_30', shelf: 'evenings', metric: 'memories', target: 30 },
  { id: 'circle_five', shelf: 'circle', metric: 'people', target: 5 },
  { id: 'little_steps_seven', shelf: 'beginnings', metric: 'littleSteps', target: 7 },
  { id: 'founding_member', shelf: 'membership', metric: 'memberNumber', target: 1 },
  { id: 'supporter', shelf: 'membership', metric: 'paidPurchase', target: 1 },
];