// Pricing shown on the public landing page (src/pages/Welcome.jsx).
// Mirrors the products and prices in base44/shared/familyPackages.ts, which is
// what checkout actually charges — update both together when a price changes.

export const LANDING_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Everything you need to stay close.',
    price: '$9.49',
    period: '/ year',
    lifetime: '$29.99 once',
    cta: 'Start 7-day free trial',
    features: [
      'Unlimited people, pets & groups',
      'Acts of support with gentle reminders',
      'Calendar, special dates & countdowns',
      'Gift tracker & personal notes',
      'Prayer and care check-ins',
      'Progress over time',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'For the people who plan ahead.',
    price: '$18.99',
    period: '/ year',
    lifetime: '$59.99 once',
    cta: 'Start 7-day free trial',
    highlight: true,
    features: [
      'Everything in Basic',
      'AI gift finder with buy links',
      'AI message & card writer',
      'Card art, made just for them',
      'Vacation planner with itineraries',
      'Remembrance & Year in Moments',
      'Ask FinBump chat assistant',
    ],
  },
];

export const FAMILY_LINE =
  'Sharing with family: Starter $29.99/yr (you + 1 pass), Family Package $44.99/yr (you + 3), Super Family Pass $49.99/yr (you + 4), or Lifetime Family/Group Plan $179.99 once.';

export const PRICING_FINE_PRINT =
  'Prices in USD. The 7-day free trial converts to the plan you choose unless you cancel before day 7. No ads on any plan, ever.';