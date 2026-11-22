// Authoritative server-side entitlement checks.
//
// User.plan, User.lifetimeTier, User.accessApproved and User.passExpiresAt
// are client-writable via base44.auth.updateMe(), so they cannot be trusted
// as the source of truth for premium access or invite-gate status. These
// helpers query the immutable ledger (Base44Purchase, PassCode, AccessCode)
// instead — those entities are admin-only via RLS, so only backend functions
// acting as service role can write them.

import { PRODUCTS } from "./familyPackages.ts";

/**
 * Determines whether a user has premium access by querying the immutable
 * purchase and pass-code ledgers. Must be called with base44.asServiceRole
 * (bypasses RLS) from a backend function.
 *
 * @param db        - base44.asServiceRole client
 * @param userId    - the authenticated user's id
 * @param userEmail - the authenticated user's email (fallback for anonymous
 *                    buyers whose Base44Purchase.appUserId is null)
 */
export async function checkPremiumEntitlement(
  db: any,
  userId: string,
  userEmail?: string,
): Promise<{
  isBasic: boolean;
  isPremium: boolean;
  isLifetime: boolean;
  tier: "basic" | "premium" | null;
}> {
  const now = Date.now();
  let isBasic = false;
  let isPremium = false;
  let isLifetime = false;

  // 1. Paid purchases (Base44Purchase ledger — admin-only writes via webhook).
  //    Normal path: appUserId is set by create-checkout when the user is
  //    signed in. Fallback: anonymous buyer matched by email.
  //
  // Tier-aware: a Basic subscription/trial/lifetime grants Basic access only,
  // NOT Premium. This must match the in-app FeatureGate, which gates the
  // Premium-only AI features on plan === "premium" (or a non-basic lifetime
  // tier). Previously every paid purchase set isPremium = true, so a Basic
  // subscriber the UI blocked from Premium features could still call those
  // same functions through the SDK.
  let purchases = await db.entities.Base44Purchase.filter({
    appUserId: userId,
    status: "paid",
  });
  if ((!purchases || purchases.length === 0) && userEmail) {
    purchases = await db.entities.Base44Purchase.filter({
      buyerEmail: userEmail,
      status: "paid",
    });
  }

  for (const p of purchases ?? []) {
    const productDef = PRODUCTS[p.productId];
    if (!productDef) continue;
    // A seat bought for someone else (extra person on a family plan) unlocks a
    // pass for that person, never access for the buyer.
    if (productDef.addOn) continue;
    // A subscription Base44 Payments reports as canceled or ended grants nothing,
    // even while its purchase row still reads "paid" — this makes an immediate
    // cancellation revoke access on its own, instead of depending on the
    // subscription webhook arriving. A soft cancellation stays ACTIVE, so the
    // member keeps the period they already paid for.
    const subStatus = String((p as any).subscriptionStatus ?? "").toUpperCase();
    if (subStatus === "CANCELED" || subStatus === "ENDED") continue;
    const grantsPremium = productDef.tier === "premium";

    // Lifetime purchases are permanently active once paid.
    if (productDef.lifetime) {
      isLifetime = true;
      if (grantsPremium) isPremium = true;
      else isBasic = true;
      continue;
    }
    // Trial subscriptions: active only while trialEndDate hasn't passed.
    // The webhook sets status to "canceled" when the trial converts to a
    // paid subscription or expires, but there can be a gap between the
    // trial end date and the webhook arriving — check trialEndDate to
    // close that gap. A Basic trial grants Basic, not Premium.
    if (productDef.trial && p.trialEndDate) {
      if (new Date(p.trialEndDate).getTime() > now) {
        if (grantsPremium) isPremium = true;
        else isBasic = true;
      }
      continue;
    }
    // Regular paid subscription: active while status is "paid". The
    // webhook flips status to "canceled" when the subscription ends.
    if (grantsPremium) isPremium = true;
    else isBasic = true;
  }

  // 2. Redeemed pass codes (PassCode ledger — admin-only writes).
  //    Annual pass = 365 days from redemption; monthly = 30 days.
  //    Every pass code originates from a Premium family package, so any
  //    active pass grants Premium access.
  const passCodes = await db.entities.PassCode.filter({ usedBy: userId });
  for (const pc of passCodes ?? []) {
    if (!pc.usedAt) continue;
    const redeemedAt = new Date(pc.usedAt).getTime();
    const durationMs =
      pc.passType === "annual"
        ? 365 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
    if (now < redeemedAt + durationMs) {
      isPremium = true;
    }
  }

  const tier = isPremium ? "premium" : isBasic ? "basic" : null;
  return { isBasic, isPremium, isLifetime, tier };
}

// Sign-up is open: there is no invite code to redeem and no approval step, so
// the old access-gate helpers (checkAccessApproved / isAccessApproved) were
// removed. Cost-bearing endpoints simply require a signed-in account
// (base44.auth.me() → 401), and paid features are decided by
// checkPremiumEntitlement against the purchase ledger, never here.