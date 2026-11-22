// Shared proration logic for subscription cancellation. Used by both
// cancel-subscription (to build a CancelRequest) and approve-cancellation
// (to re-verify the refund/trial fields server-side from the authoritative
// Base44Purchase record, not user-writable CancelRequest fields).
//
// Plan-aware: each tier (basic/premium) and billing cycle (annual/monthly)
// has its own price and cycle length, so the prorated refund is calculated
// against the correct cycle rather than a single hard-coded annual price.

export const TRIAL_DAYS = 7;

export const PLAN_CONFIGS: Record<string, { price: number; cycleMonths: number; label: string }> = {
  "keepsake-basic-monthly": { price: 2.99, cycleMonths: 3, label: "Basic Quarterly" },
  "keepsake-basic-yearly": { price: 9.49, cycleMonths: 12, label: "Basic Annual" },
  "keepsake-premium-monthly": { price: 5.99, cycleMonths: 3, label: "Premium Quarterly" },
  "keepsake-premium-yearly": { price: 18.99, cycleMonths: 12, label: "Premium Annual" },
  "keepsake-premium-quarterly": { price: 6.99, cycleMonths: 3, label: "Premium Quarterly" },
};

export const DEFAULT_PLAN = PLAN_CONFIGS["keepsake-premium-yearly"];

export function getPlanConfig(productId: string | null | undefined) {
  return (productId && PLAN_CONFIGS[productId]) || DEFAULT_PLAN;
}

export function calculateProration(
  subscriptionStartDate: string | null,
  trialEndDate: string | null,
  cancellationDate: string,
  planConfig: { price: number; cycleMonths: number } = DEFAULT_PLAN,
): {
  isTrial: boolean;
  monthsUsed: number;
  refundAmount: number;
  effectiveDate: string;
} {
  const cancelDate = new Date(cancellationDate);

  // Within trial period: no refund, cancel at trial end
  if (trialEndDate && cancelDate < new Date(trialEndDate)) {
    return {
      isTrial: true,
      monthsUsed: 0,
      refundAmount: 0,
      effectiveDate: trialEndDate,
    };
  }

  // Post-trial: calculate from charge date (trial end, or subscription start if no trial)
  const chargeDate = trialEndDate ? new Date(trialEndDate) : new Date(subscriptionStartDate ?? cancellationDate);

  // Months used: one day in a month counts as the whole month
  let monthsUsed = 0;
  const d = new Date(chargeDate);
  while (d <= cancelDate) {
    monthsUsed++;
    d.setMonth(d.getMonth() + 1);
  }
  monthsUsed = Math.min(monthsUsed, planConfig.cycleMonths);

  // Effective date: last day of the current month
  const effectiveDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth() + 1, 0, 23, 59, 59);

  // Refund: remaining months in the billing cycle × monthly rate
  const monthlyRate = planConfig.price / planConfig.cycleMonths;
  const remainingMonths = planConfig.cycleMonths - monthsUsed;
  const refundAmount = Math.max(0, Math.round(remainingMonths * monthlyRate * 100) / 100);

  return {
    isTrial: false,
    monthsUsed,
    refundAmount,
    effectiveDate: effectiveDate.toISOString(),
  };
}