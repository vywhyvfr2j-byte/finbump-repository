// Base44 Payments checkout starter — base44/functions/create-checkout/entry.ts
//
// Provided by the platform. Do NOT rewrite the plumbing (session construct + persisting the
// join key + return-URL resolution). Edit only the region marked `// ===== APP-SPECIFIC =====`
// to resolve — SERVER-SIDE — what the buyer is purchasing and its price.
//
// AUTHENTICATED: this app is invite-only, so every checkout is initiated by a signed-in user.
// The handler requires an authenticated caller (returns 401 otherwise) so the endpoint can't be
// invoked by anyone who knows the URL. The signed-in buyer's app-user id is the fulfillment
// target the webhook grants to.
//
// CRITICAL: Wix's checkout has NO custom-metadata field, so the returned `checkoutSession.id` is
// the ONLY thing that ties this payment back to this purchase. We persist it on a pending
// Base44Purchase BEFORE redirecting; the webhook resolves the purchase by that same id
// (order.checkoutId === checkoutSession.id). Skipping this write makes fulfillment impossible.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { resolveAppUrl } from "../../shared/appUrl.ts";

const CONSTRUCT_URL = "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct";

// The app's public base URL for the buyer's return links. Resolved by the shared
// `../../shared/appUrl.ts` helper: the platform-injected `X-Base44-App-Url` header is used only
// when it points at an origin this app owns, otherwise the server-owned
// `WIX_CHECKOUT_APP_URL` secret is — a caller-supplied header can no longer send the paid buyer
// to an attacker page (open redirect). We do NOT fall back to the request `Origin` either: it's
// caller-controlled too.

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    // Read per request, never at module scope: disconnecting payments blanks these, and a warm
    // isolate that captured them at startup would keep charging with the old credentials.
    const WIX_API_KEY = Deno.env.get("WIX_CHECKOUT_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_CHECKOUT_SITE_ID");
    if (!WIX_API_KEY || !WIX_SITE_ID) {
      console.error("create-checkout: Wix payment config not set");
      return new Response(JSON.stringify({ error: "Payments not configured" }), { status: 500 });
    }

    const appUrl = resolveAppUrl(req);
    if (!appUrl) {
      // Fail closed: with no server-owned app URL (both the X-Base44-App-Url header AND the
      // WIX_CHECKOUT_APP_URL secret are absent — e.g. a slug-less or partially-wired app) we'd build
      // relative return links like `/ThankYou` and strand the paid buyer. Never fall back to the
      // caller-controlled Origin (open redirect). Reconnecting payments repopulates the secret.
      console.error("create-checkout: no app URL (X-Base44-App-Url header and WIX_CHECKOUT_APP_URL both empty)");
      return new Response(JSON.stringify({ error: "Payments not configured" }), { status: 500 });
    }
    const base44 = createClientFromRequest(req);

    // Require an authenticated caller — this app is invite-only, so every checkout is
    // initiated by a signed-in user. The buyer's app-user id is the fulfillment target the
    // webhook grants to.
    let appUser = null;
    try {
      appUser = await base44.auth.me();
    } catch (_) {
      appUser = null;
    }
    if (!appUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // ===== APP-SPECIFIC =====
    // FinBump Premium — individual plans (annual, quarterly, monthly) plus family
    // packages that bundle shareable passes. Product + price resolved SERVER-SIDE so
    // the buyer can only send the product id and never the amount. Wix has no
    // "QUARTER" frequency — quarterly is MONTH with interval: 3 (per Wix docs).
    // The shared PRODUCTS map is the single source of truth for both this function
    // and the payments webhook (which grants pass credits for family packages).
    //
    // Family packages use a MIXED CART: a one-time charge at full price for year 1,
    // plus a subscription at 15% off with a 365-day free trial so the first renewal
    // charge (at the discounted price) lands at the start of year 2. Individual plans
    // use a single subscription item at full price (with a 7-day free trial).
    const { PRODUCTS, UPGRADE_WINDOW_DAYS } = await import("../../shared/familyPackages.ts");
    const productId = String(body.productId ?? "");
    if (!PRODUCTS[productId]) {
      return new Response(JSON.stringify({ error: "Unknown product" }), { status: 400 });
    }
    const product = PRODUCTS[productId];
    const productName = product.name;
    let price = product.price;
    const currency = product.currency;
    // The $10/person add-on is the only multi-unit product; every other plan is quantity 1.
    const isAddOn = productId === "keepsake-extra-person";
    // Bounded integer, never a caller-chosen amount: a quantity outside 1..20 is
    // clamped here so a crafted request cannot build an absurd checkout or pass
    // count. Every other product is a single seat.
    const MAX_ADDON_QUANTITY = 20;
    const requested = parseInt(body.quantity, 10);
    const quantity = isAddOn
      ? Math.min(MAX_ADDON_QUANTITY, Math.max(1, Number.isFinite(requested) ? requested : 1))
      : 1;
    // "Pay before the trial ends": the member chooses to pay today instead of
    // day 8, so the same plan is sold WITHOUT the free trial period and the card
    // is charged at checkout. Price and product still come from the map above.
    const payNow = body.payNow === true;

    // Lifetime upgrades are charged at full price — no discount is applied to
    // prior recurring payments. The client may still send isUpgrade, but it no
    // longer affects pricing.
    // Where Wix returns the buyer. Both MUST be real, publicly reachable routes.
    const thankYouPath = "/ThankYou";
    const postFlowPath = "/";

    const hasRenewalDiscount = (product.renewalDiscount ?? 0) > 0;
    const isLifetime = product.lifetime === true;
    let cartItems;
    let checkoutAmount;

    if (isLifetime) {
      // One-time charge — no subscriptionInfo, no renewal, permanent access.
      cartItems = [{ name: productName, quantity, price }];
      checkoutAmount = parseFloat(price) * quantity;
    } else if (hasRenewalDiscount) {
      // Mixed cart: one-time full price for year 1 + discounted subscription with 365-day trial.
      const renewalPrice = (parseFloat(price) * (1 - (product.renewalDiscount ?? 0))).toFixed(2);
      const discountPercent = Math.round((product.renewalDiscount ?? 0) * 100);
      cartItems = [
        { name: productName, quantity, price },
        {
          name: `${productName} — Annual Renewal`,
          quantity,
          price: renewalPrice,
          subscriptionInfo: {
            subscriptionSettings: {
              frequency: product.frequency,
              freeTrialPeriod: { frequency: "DAY", interval: 365 },
            },
            title: `${product.title} — Annual Renewal`,
            description: `Annual renewal at ${discountPercent}% loyalty discount`,
          },
        },
      ];
      checkoutAmount = parseFloat(price) * quantity;
    } else {
      // Single subscription item (individual plans + any family pkg without discount).
      const subscriptionInfo = {
        subscriptionSettings: {
          frequency: product.frequency,
          ...(product.interval ? { interval: product.interval } : {}),
          ...(product.trial && !payNow ? { freeTrialPeriod: { frequency: "DAY", interval: 7 } } : {}),
        },
        title: product.title,
        description: product.description,
      };
      cartItems = [{ name: productName, quantity, price, subscriptionInfo }];
      checkoutAmount = parseFloat(price) * quantity;
    }
    // ===== END APP-SPECIFIC =====

    if (!(checkoutAmount >= 0.5)) {
      // Wix rejects charges under 0.50 in the charged currency (major units, not cents).
      return new Response(JSON.stringify({ error: "Amount must be at least 0.50" }), { status: 400 });
    }

    const constructBody = {
      cart: {
        items: cartItems,
        // Prefill the signed-in buyer's email if we have one; anonymous buyers enter it on Wix.
        ...(appUser?.email ? { customerInfo: { email: appUser.email } } : {}),
      },
      callbackUrls: {
        thankYouPageUrl: `${appUrl}${thankYouPath}`,
        postFlowUrl: `${appUrl}${postFlowPath}`,
      },
    };

    const wixRes = await fetch(CONSTRUCT_URL, {
      method: "POST",
      headers: {
        "Authorization": WIX_API_KEY,
        "wix-site-id": WIX_SITE_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(constructBody),
    });

    if (!wixRes.ok) {
      const errText = await wixRes.text();
      console.error("create-checkout: Wix construct failed", { status: wixRes.status, errText });
      return new Response(JSON.stringify({ error: "Could not start checkout" }), { status: 502 });
    }

    const { checkoutSession } = await wixRes.json();
    const checkoutSessionId: string = checkoutSession?.id;
    const redirectUrl: string = checkoutSession?.redirectUrl;

    if (!checkoutSessionId || !redirectUrl) {
      console.error("create-checkout: missing checkoutSession id/redirectUrl", checkoutSession);
      return new Response(JSON.stringify({ error: "Could not start checkout" }), { status: 502 });
    }

    // PERSIST THE JOIN KEY (the whole point). Pending until the webhook flips it to "paid".
    // asServiceRole so the row is trustworthy — Base44Purchase RLS blocks client writes, so a buyer
    // can't forge a paid purchase. appUserId is the fulfillment target when known; null for an
    // anonymous buyer (the webhook then grants by buyerEmail).
    await base44.asServiceRole.entities.Base44Purchase.create({
      checkoutSessionId,
      status: "pending",
      appUserId: appUser?.id ?? null,
      buyerEmail: appUser?.email ?? null,
      // The server-resolved product key — the webhook grant reads this to decide what to unlock.
      productId,
      productName,
      // Persist the validated quantity so the webhook's grant can award the RIGHT count
      // (seats/credits/items) for a multi-unit purchase — the grant runs later from this row and has
      // no other authoritative count. (Fixed-entitlement plans keep quantity 1.)
      quantity,
      // Charged total (unit price × quantity), so the record matches what Wix charged.
      amount: checkoutAmount.toFixed(2),
      // What the card is charged today: nothing on a 7-day trial, the full price
      // otherwise. The webhook validates the approved order's total against this,
      // because a trial's order is zero while its recurring price is not.
      amountDueNow: product.trial === true && !payNow ? "0.00" : checkoutAmount.toFixed(2),
      currency,
      // Did this checkout carry the 7-day free trial? Only a trial plan the buyer
      // did NOT choose to pay today does. The webhook reads this to decide whether
      // the purchase is a running trial (expires on day 8) or a paid plan, so a
      // member who pays up front is never treated as being on a trial.
      trialIncluded: product.trial === true && !payNow,
    });

    return new Response(JSON.stringify({ redirectUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout: unhandled error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});