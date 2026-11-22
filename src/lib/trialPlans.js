// Trial helpers shared by the trial status card. A trial purchase is a paid
// subscription row that carries a trialEndDate (only trial products get one —
// lifetime and family purchases never do), so the card can show real progress
// instead of guessing from the account's plan.
export const TRIAL_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

export const TRIAL_PLANS = {
  'keepsake-basic-yearly': { name: 'Basic · Annual', price: '$9.49' },
  'keepsake-basic-monthly': { name: 'Basic · Quarterly', price: '$2.99' },
  'keepsake-premium-yearly': { name: 'Premium · Annual', price: '$18.99' },
  'keepsake-premium-monthly': { name: 'Premium · Quarterly', price: '$5.99' },
  'keepsake-premium-quarterly': { name: 'Premium · Quarterly', price: '$6.99' },
};

export function planLabel(productId) {
  return TRIAL_PLANS[productId]?.name || 'your plan';
}

export function planPrice(productId) {
  return TRIAL_PLANS[productId]?.price || null;
}

// The trial still running on this account, newest first. A trial whose end date
// has passed is a converted (or lapsed) subscription, not a trial.
export function activeTrialPurchase(purchases) {
  const now = Date.now();
  const running = (purchases || []).filter(
    (p) =>
      p.status === 'paid' &&
      p.subscriptionId &&
      p.trialEndDate &&
      p.autoRenew !== false &&
      new Date(p.trialEndDate).getTime() > now,
  );
  return (
    running.sort(
      (a, b) => new Date(b.trialEndDate).getTime() - new Date(a.trialEndDate).getTime(),
    )[0] || null
  );
}

export function trialProgress(purchase) {
  if (!purchase?.trialEndDate) return null;
  const end = new Date(purchase.trialEndDate).getTime();
  const start = purchase.paidAt ? new Date(purchase.paidAt).getTime() : end - TRIAL_DAYS * DAY;
  const now = Date.now();
  if (now >= end) return null;
  const elapsedDays = Math.floor((now - start) / DAY) + 1;
  const day = Math.min(TRIAL_DAYS, Math.max(1, elapsedDays));
  return {
    day,
    daysLeft: Math.max(1, Math.ceil((end - now) / DAY)),
    percent: Math.round((day / TRIAL_DAYS) * 100),
    endDate: new Date(end),
  };
}