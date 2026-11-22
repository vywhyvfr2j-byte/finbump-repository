// Base44 Payments fulfillment webhook — base44/functions/payments-webhook/entry.ts
//
// Provided by the platform. Do NOT rewrite the plumbing (JWT verification, envelope parsing,
// purchase resolution, idempotency). Only edit the region marked
// `// ===== APP-SPECIFIC =====` to define what "grant access" means for this app.
//
// It receives Wix `ORDER_APPROVED` events (and optional subscription lifecycle events),
// verifies the RS256 JWT, resolves the buyer's pending Purchase by checkout id, and marks
// it paid exactly once. It pairs with `create-checkout`, which MUST persist
// `checkoutSession.id` on the Purchase — Wix has no custom-metadata field, so the checkout
// id is the ONLY correlation key back to this app's user.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { importSPKI, jwtVerify } from "npm:jose@5.9.6";

// Wix event types (verbatim from Wix docs).
const ORDER_APPROVED = "wix.ecom.v1.order_approved";
const SUBSCRIPTION_CANCELED = "wix.ecom.subscription_contracts.v1.subscription_contract_canceled";
const SUBSCRIPTION_EXPIRED = "wix.ecom.subscription_contracts.v1.subscription_contract_expired";

// Unwrap Wix's triple-nested envelope: the request body is a JWT whose verified
// payload has a `data` JSON string; that parses to an envelope with `eventType` and
// another `data` JSON string; that parses to the event data holding the order.
function parseWixEnvelope(payload: Record<string, unknown>): { eventType: string; eventData: any } {
  const outer = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
  // eventType lives on the parsed envelope; newer DomainEvent envelopes may also carry it as a
  // top-level JWT claim — fall back to that so the event isn't misrouted to the ignore branch.
  const eventType: string = outer?.eventType ?? (payload.eventType as string) ?? "";
  const eventData = typeof outer?.data === "string" ? JSON.parse(outer.data) : outer?.data;
  return { eventType, eventData };
}

// Wix delivers the event body at `eventData.actionEvent.body` (per the checkout
// webhooks doc): the order is `eventData.actionEvent.body.order`, the
// subscription contract is `eventData.actionEvent.body.subscriptionContract`.
// Reading only `eventData.order`, as this handler used to, never found the order,
// so every paid checkout was acknowledged with nothing granted. The old shapes
// stay as fallbacks in case Wix flattens a payload.
function extractOrder(eventData: any): any | null {
  return eventData?.actionEvent?.body?.order ?? eventData?.order ?? null;
}

function extractSubscriptionContract(eventData: any): any | null {
  return (
    eventData?.actionEvent?.body?.subscriptionContract ??
    eventData?.subscriptionContract ??
    eventData?.entity ??
    null
  );
}

// Money compared in cents of a decimal string, so "18.99" and "18.9" never pass
// as equal and float drift can't decide whether a payment was made.
function toCents(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

// A subscription that Base44 Payments reports as ACTIVE (or PENDING right after
// checkout) is a contracted subscription. null means the read itself failed, and
// the caller asks Wix to retry rather than granting on an unverified contract.
async function readSubscriptionStatus(subscriptionId: string): Promise<string | null> {
  const apiKey = Deno.env.get("WIX_PAYMENTS_API_KEY");
  const siteId = Deno.env.get("WIX_PAYMENTS_SITE_ID");
  if (!apiKey || !siteId) return null;
  try {
    const res = await fetch(
      `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: { Authorization: apiKey, "wix-site-id": siteId },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) {
      console.error("payments-webhook: subscription read failed", { subscriptionId, status: res.status });
      return null;
    }
    const data = await res.json();
    return String(data?.subscription?.status ?? "").toUpperCase() || null;
  } catch (err) {
    console.error("payments-webhook: subscription read threw", { subscriptionId, err });
    return null;
  }
}

// The buyer's email, as entered on Wix's hosted checkout page. This is the ONLY identity for an
// anonymous buyer (one who wasn't signed in when create-checkout ran, so appUserId is null). Wix
// exposes it in a few places depending on the flow; check the common ones.
function extractBuyerEmail(order: any): string | null {
  return (
    order?.buyerInfo?.email ??
    order?.billingInfo?.contactDetails?.email ??
    order?.billingInfo?.email ??
    null
  );
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Read per request, never at module scope: the key is stored when the webhook is registered, so
    // a warm isolate that captured it at startup would stay keyless and 500 every ORDER_APPROVED.
    const WEBHOOK_PUBLIC_KEY = Deno.env.get("WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY");
    if (!WEBHOOK_PUBLIC_KEY) {
      // Never process an unverifiable event. Missing key = misconfiguration, not a retry case.
      console.error("payments-webhook: WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY is not set");
      return new Response("Webhook not configured", { status: 500 });
    }

    // The raw body IS the JWT (Wix signs the whole payload, RS256).
    const token = await req.text();

    let payload: Record<string, unknown>;
    try {
      const key = await importSPKI(WEBHOOK_PUBLIC_KEY, "RS256");
      const verified = await jwtVerify(token, key);
      payload = verified.payload as Record<string, unknown>;
    } catch (err) {
      // Signature invalid / malformed. Reject — do NOT grant anything.
      console.error("payments-webhook: JWT verification failed", err);
      return new Response("Invalid signature", { status: 401 });
    }

    const { eventType, eventData } = parseWixEnvelope(payload);
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole; // No end user is authenticated on a webhook call.

    if (eventType === ORDER_APPROVED) {
      return await handleOrderApproved(db, eventData);
    }

    if (eventType === SUBSCRIPTION_CANCELED || eventType === SUBSCRIPTION_EXPIRED) {
      return await handleSubscriptionEnded(db, eventData);
    }

    // Unknown/irrelevant event — acknowledge so Wix stops retrying.
    console.log(`payments-webhook: ignoring event ${eventType}`);
    return new Response("OK", { status: 200 });
  } catch (err) {
    // Unexpected failure: 500 tells Wix to retry later (the handler is idempotent, so a
    // retry after a partial failure is safe).
    console.error("payments-webhook: unhandled error", err);
    return new Response("Internal error", { status: 500 });
  }
});

async function handleOrderApproved(db: any, eventData: any): Promise<Response> {
  const order = extractOrder(eventData);
  const checkoutId: string | undefined = order?.checkoutId;
  const orderId: string | undefined = order?.id;
  // Subscription id (if any) — persisted below so SUBSCRIPTION_CANCELED/EXPIRED can later
  // resolve this purchase by subscriptionId and revoke access.
  const subscriptionId: string | undefined = (order?.lineItems ?? [])
    .map((li: any) => li?.subscriptionInfo?.id)
    .find((id: any) => !!id);

  if (!checkoutId) {
    // Nothing to correlate on. Acknowledge to stop retries; log for investigation.
    console.error("payments-webhook: ORDER_APPROVED missing order.checkoutId", { orderId });
    return new Response("OK", { status: 200 });
  }

  // Resolve the pending purchase created by `create-checkout` (join key: checkoutSessionId).
  const matches = await db.entities.Base44Purchase.filter({ checkoutSessionId: checkoutId });
  const purchase = matches?.[0];

  if (!purchase) {
    // Renewal order: if this order carries a subscriptionId we already know about,
    // the user is already premium — just ACK so Wix doesn't retry.
    if (subscriptionId) {
      const subMatches = await db.entities.Base44Purchase.filter({ subscriptionId });
      if (subMatches?.[0]?.status === "paid") {
        // Trial converted to paid: clear the trial pass expiry and ensure the
        // plan is still granted. The auto-expiry check in redeem-pass-code may
        // have reverted the plan to "free" if this renewal arrived after the
        // 7-day trial lapsed but before Wix's subscription-cancel event.
        const renewalPurchase = subMatches[0];
        const renewalUserId = renewalPurchase.appUserId;
        if (renewalUserId) {
          try {
            const { PRODUCTS } = await import("../../shared/familyPackages.ts");
            const renewalProduct = PRODUCTS[renewalPurchase.productId];
            if (!renewalProduct?.addOn) {
              await db.entities.User.update(renewalUserId, {
                plan: renewalProduct?.tier || "premium",
                passExpiresAt: null,
              });
            }
            // Clear the trial marker: this charge is the trial converting to a
            // paid subscription. Left in place, the lapsed trialEndDate made the
            // entitlement check drop a paying member back to free on day 8.
            await db.entities.Base44Purchase.update(renewalPurchase.id, {
              trialEndDate: null,
              autoRenew: true,
              subscriptionStatus: "ACTIVE",
              subscriptionCheckedAt: new Date().toISOString(),
            });
          } catch (err) {
            console.error("payments-webhook: renewal re-grant failed", { renewalUserId, err });
          }
        }
        console.log("payments-webhook: renewal order for existing subscription, ACKing", { subscriptionId, orderId });
        return new Response("OK", { status: 200 });
      }
    }
    // The pending Base44Purchase is written by create-checkout before the buyer pays, so a miss
    // here is a transient race (entity not yet visible) — return 500 so Wix retries, rather
    // than ACKing a paid order we can't fulfill. (Wix stops after its retry window.)
    console.warn("payments-webhook: no Base44Purchase for checkoutId yet, asking Wix to retry", { checkoutId, orderId });
    return new Response("Purchase not found yet", { status: 500 });
  }

  // IDEMPOTENCY + terminal states: Wix delivers ORDER_APPROVED more than once, and may deliver
  // a stale approval after a cancellation. Skip if already "paid" (prevents double-grant) or
  // "canceled" (a late approval must not resurrect a revoked subscription).
  if (purchase.status === "paid" || purchase.status === "canceled") {
    console.log("payments-webhook: purchase already terminal, skipping", { checkoutId, status: purchase.status });
    return new Response("OK", { status: 200 });
  }

  // ---- Payment validation, before anything is granted ----
  // A verified JWT proves Wix sent the event; it does not prove the order was
  // paid, nor that the amount is the one this app charged. Both are checked here
  // against what create-checkout resolved server-side.
  // A field Wix leaves out is not treated as a mismatch (that would brick
  // fulfillment if the payload shape changes), but a field that is present and
  // wrong blocks the grant and leaves the purchase pending.
  const { PRODUCTS: PURCHASE_PRODUCTS } = await import("../../shared/familyPackages.ts");
  const purchaseProduct = PURCHASE_PRODUCTS[purchase.productId];
  const pendingTrial = purchaseProduct?.trial === true && purchase.trialIncluded !== false;

  const orderStatus = String(order?.status ?? "").toUpperCase();
  const paymentStatus = String(order?.paymentStatus ?? "").toUpperCase();
  if (orderStatus && orderStatus !== "APPROVED") {
    console.warn("payments-webhook: order not APPROVED, not granting", { checkoutId, orderId, orderStatus });
    return new Response("OK", { status: 200 });
  }
  if (paymentStatus && paymentStatus !== "PAID") {
    console.warn("payments-webhook: order not PAID, not granting", { checkoutId, orderId, paymentStatus });
    return new Response("OK", { status: 200 });
  }

  const orderCents = toCents(order?.priceSummary?.total?.amount);
  const fullCents = toCents(purchase.amount);
  // A trial's order is zero today; a paid or lifetime plan's order is its full
  // price. A trial order may also carry the full price on some Wix plans, so
  // both are accepted there — nothing else is.
  const amountOk =
    orderCents === null
      ? true
      : pendingTrial
        ? orderCents === 0 || orderCents === fullCents
        : orderCents === fullCents;
  const orderCurrency = String(order?.currency ?? "").toUpperCase();
  const expectedCurrency = String(purchase.currency ?? "USD").toUpperCase();
  if (!amountOk || (orderCurrency && orderCurrency !== expectedCurrency)) {
    console.error("payments-webhook: order total does not match the purchase, not granting", {
      checkoutId,
      orderId,
      orderAmount: order?.priceSummary?.total?.amount,
      expectedAmount: pendingTrial ? purchase.amountDueNow ?? "0.00" : purchase.amount,
      orderCurrency,
      expectedCurrency,
    });
    return new Response("OK", { status: 200 });
  }

  // Trials charge nothing today, so the order alone cannot prove the card was
  // ever taken: the subscription itself must exist and be live at Base44 Payments.
  if (pendingTrial) {
    if (!subscriptionId) {
      console.error("payments-webhook: trial order carries no subscription id, not granting", { checkoutId, orderId });
      return new Response("OK", { status: 200 });
    }
    const subStatus = await readSubscriptionStatus(subscriptionId);
    if (subStatus === null) {
      // Could not read the contract — ask Wix to retry rather than grant blind.
      return new Response("Subscription not verifiable yet", { status: 500 });
    }
    if (!["ACTIVE", "PENDING"].includes(subStatus)) {
      console.error("payments-webhook: trial subscription not live, not granting", { checkoutId, subscriptionId, subStatus });
      return new Response("OK", { status: 200 });
    }
  }

  // The buyer's email: from create-checkout if they were signed in, otherwise from the Wix order
  // (the only identity an anonymous buyer has). Persisted below and used by the grant block.
  const buyerEmail: string | null = purchase.buyerEmail ?? extractBuyerEmail(order);

  // ===== APP-SPECIFIC =====
  // FinBump Premium: flip the buyer's plan to "premium". FinBump is behind auth, so the buyer
  // is signed in (purchase.appUserId set) in the normal path. For an anonymous buyer we match the
  // Wix checkout email to a User; if none matches we log it (User records are invite-only and
  // can't be created here). Idempotent — User.update keyed on id.
  //
  // Family packages also credit the purchaser's account with shareable passes — the webhook
  // reads the pass-credit counts from the shared product map so they stay in sync with checkout.
  const { PRODUCTS } = await import("../../shared/familyPackages.ts");
  const productDef = PRODUCTS[purchase.productId];
  // An add-on is a seat bought for someone else: it credits a shareable pass and
  // must not touch the buyer's own plan or lifetime tier (writing its
  // "lifetime-extra-person" tier over a real one used to hand the buyer premium).
  const isAddOnPurchase = productDef?.addOn === true;
  const grantUpdate: Record<string, unknown> = {};
  if (!isAddOnPurchase) {
    grantUpdate.plan = productDef?.tier || "premium";
    if (productDef && productDef.lifetime && productDef.lifetimeTier) {
      // Lifetime pass: set the tier so access is permanent and never reverts.
      grantUpdate.lifetimeTier = productDef.lifetimeTier;
    }
  }
  // Trial subscriptions: set a pass-style expiry (7 days) so the auto-expiry
  // check in redeem-pass-code reverts the plan to "free" if the trial ends
  // without conversion. Cleared when the first renewal order arrives above.
  // A member who paid today instead of waiting out the trial is on a paid plan,
  // not a trial, so they get no 7-day expiry (purchase.trialIncluded is false).
  const isTrialPurchase = productDef?.trial === true && purchase.trialIncluded !== false;
  if (isTrialPurchase) {
    grantUpdate.passExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    // Bought or lifetime: clear any trial expiry left on the account, so nothing
    // downgrades this member to "free" seven days after an older trial started.
    grantUpdate.passExpiresAt = null;
  }
  let grantUserId: string | null = purchase.appUserId ?? null;
  if (!grantUserId && buyerEmail) {
    const byEmail = await db.entities.User.filter({ email: buyerEmail });
    grantUserId = byEmail?.[0]?.id ?? null;
  }
  if (grantUserId) {
    try {
      // An add-on leaves the plan untouched, so there is nothing to write on the user.
      if (Object.keys(grantUpdate).length > 0) {
        await db.entities.User.update(grantUserId, grantUpdate);
      }
      // Grant shareable pass credits as individual PassCredit ledger rows so
      // generate-pass-code can consume one atomically (the built-in User entity
      // does not support atomic conditional decrements). Each grant resets the
      // purchaser's credits for the pass type, matching the previous overwrite
      // semantics (a fresh batch per purchase/renewal).
      if (productDef) {
        const annualCount = productDef.lifetime
          ? (productDef.passCreditsLifetime || 0)
          : (productDef.passCreditsAnnual || 0);
        const monthlyCount = productDef.passCreditsMonthly || 0;
        if (annualCount > 0) {
          await db.entities.PassCredit.deleteMany({ ownerId: grantUserId, passType: "annual" });
          await db.entities.PassCredit.bulkCreate(
            Array.from({ length: annualCount }, () => ({
              ownerId: grantUserId, passType: "annual", packageId: purchase.productId, status: "available",
            })),
          );
        }
        if (monthlyCount > 0) {
          await db.entities.PassCredit.deleteMany({ ownerId: grantUserId, passType: "monthly" });
          await db.entities.PassCredit.bulkCreate(
            Array.from({ length: monthlyCount }, () => ({
              ownerId: grantUserId, passType: "monthly", packageId: purchase.productId, status: "available",
            })),
          );
        }
      }
    } catch (err) {
      console.error("payments-webhook: grant User.update / PassCredit grant failed", { grantUserId, err });
      throw err; // keep "pending" so Wix's retry re-runs the grant
    }
  } else {
    console.warn("payments-webhook: no user to grant premium (anonymous, no email match)", { buyerEmail });
  }

  // A member can choose to pay before the 7-day trial ends: that checkout creates a
  // second, trial-free subscription while the trial subscription is still running.
  // Now that this purchase is confirmed, stop the superseded trial so the card on
  // file is never charged for both. Non-fatal by design — the member has paid.
  // Runs for bought plans and for a trial plan paid up front before day 8 — in both
  // cases the still-running trial subscription must be stopped or the card is
  // charged for it too.
  if (grantUserId && productDef && (!productDef.trial || !isTrialPurchase)) {
    try {
      const allPurchases = await db.entities.Base44Purchase.filter({ appUserId: grantUserId });
      const superseded = (allPurchases || []).filter(
        (p: any) =>
          p.id !== purchase.id &&
          p.status === "paid" &&
          p.subscriptionId &&
          p.trialEndDate &&
          new Date(p.trialEndDate).getTime() > Date.now() &&
          p.autoRenew !== false &&
          PRODUCTS[p.productId]?.trial === true,
      );
      const wixKey = Deno.env.get("WIX_PAYMENTS_API_KEY");
      const wixSite = Deno.env.get("WIX_PAYMENTS_SITE_ID");
      if (superseded.length > 0 && wixKey && wixSite) {
        for (const old of superseded) {
          const res = await fetch(
            `https://www.wixapis.com/payments/base44/v1/subscriptions/${old.subscriptionId}/cancel`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: wixKey,
                "wix-site-id": wixSite,
              },
              body: JSON.stringify({
                subscription_id: old.subscriptionId,
                reason: "Replaced by a paid plan before the trial ended.",
                immediate: true,
              }),
              signal: AbortSignal.timeout(10000),
            },
          );
          if (!res.ok) {
            console.error("payments-webhook: could not stop superseded trial", {
              subscriptionId: old.subscriptionId,
              status: res.status,
            });
            continue;
          }
          await db.entities.Base44Purchase.update(old.id, {
            autoRenew: false,
            subscriptionStatus: "CANCELED",
            subscriptionCheckedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("payments-webhook: superseded-trial cleanup failed", { grantUserId, err });
    }
  }
  // ===== END APP-SPECIFIC =====

  // Mark paid LAST, so "paid" always implies the grant above completed. The idempotency
  // check at the top short-circuits on this status, so it must only be set after fulfillment.
  // subscriptionId is stored here so SUBSCRIPTION_CANCELED/EXPIRED can resolve this purchase.
  const paidAt = new Date();
  const isLifetime = productDef?.lifetime === true;
  const isTrial = isTrialPurchase;
  // Only trial subscriptions get a trial end date; lifetime and family packages don't.
  const trialEndDate = (isLifetime || !isTrial) ? null : new Date(paidAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  await db.entities.Base44Purchase.update(purchase.id, {
    status: "paid",
    orderId: orderId ?? purchase.orderId ?? null,
    subscriptionId: subscriptionId ?? purchase.subscriptionId ?? null,
    // A subscription renews until something turns it off — a cancellation, recorded by
    // approve-cancellation, or the weekly read of Base44 Payments. One-time and lifetime
    // buys have no subscription, so they carry no renewal state at all.
    ...(subscriptionId ? { autoRenew: true, subscriptionStatus: "ACTIVE" } : {}),
    // Persist the buyer email (backfilled from the Wix order for anonymous buyers) so the record
    // always shows who paid, even when create-checkout had no signed-in user.
    buyerEmail: buyerEmail ?? purchase.buyerEmail ?? null,
    paidAt: paidAt.toISOString(),
    ...(trialEndDate ? { trialEndDate: trialEndDate.toISOString() } : {}),
  });

  console.log("payments-webhook: fulfilled purchase", { purchaseId: purchase.id, checkoutId, orderId });
  return new Response("OK", { status: 200 });
}

async function handleSubscriptionEnded(db: any, eventData: any): Promise<Response> {
  // Canceled = ended early; Expired = ran all billing cycles. Both revoke access.
  // Mirrors the order path (eventData.<entity>); keep a fallback since the subscription
  // contract webhook body isn't as tightly documented as order_approved.
  const contract = extractSubscriptionContract(eventData);
  const subscriptionId: string | undefined = contract?.id;

  if (!subscriptionId) {
    console.error("payments-webhook: subscription event missing contract id");
    return new Response("OK", { status: 200 });
  }

  const matches = await db.entities.Base44Purchase.filter({ subscriptionId });
  const purchase = matches?.[0];
  if (!purchase) {
    // The subscriptionId is written on the Purchase by the ORDER_APPROVED handler. If a
    // cancel/expire arrives before (or racing) that approval, no Purchase matches yet —
    // return 500 so Wix retries until the approval has linked it, instead of losing the
    // revoke by acking a not-yet-linkable event.
    console.warn("payments-webhook: no Purchase for subscription yet, asking Wix to retry", { subscriptionId });
    return new Response("Purchase not linkable yet", { status: 500 });
  }

  if (purchase.status === "canceled") {
    return new Response("OK", { status: 200 }); // Idempotent.
  }

  // ===== APP-SPECIFIC =====
  // FinBump Premium ended (canceled or expired): drop the buyer's plan back to "free".
  // Mirrors the grant (by appUserId, else by the purchase email). Idempotent.
  // Lifetime pass holders are never downgraded — a subscription cancel/expire is
  // from a prior recurring plan and must not revoke lifetime access.
  let revokeUserId: string | null = purchase.appUserId ?? null;
  if (!revokeUserId && purchase.buyerEmail) {
    const byEmail = await db.entities.User.filter({ email: purchase.buyerEmail });
    revokeUserId = byEmail?.[0]?.id ?? null;
  }
  if (revokeUserId) {
    try {
      const userRecord = (await db.entities.User.filter({ id: revokeUserId }))?.[0];
      if (userRecord?.lifetimeTier) {
        console.log("payments-webhook: skipping revoke — user has lifetime tier", { revokeUserId, tier: userRecord.lifetimeTier });
      } else {
        await db.entities.User.update(revokeUserId, { plan: "free" });
      }
    } catch (err) {
      console.error("payments-webhook: revoke User.update failed", { revokeUserId, err });
      throw err; // keep status so Wix's retry re-runs the revoke
    }
  }
  // ===== END APP-SPECIFIC =====

  // Mark canceled LAST, so "canceled" always implies access was actually revoked.
  await db.entities.Base44Purchase.update(purchase.id, {
    status: "canceled",
    canceledAt: new Date().toISOString(),
  });

  console.log("payments-webhook: revoked subscription", { purchaseId: purchase.id, subscriptionId });
  return new Response("OK", { status: 200 });
}