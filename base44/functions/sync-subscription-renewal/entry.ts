import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Reads every subscription this app has on record back from Base44 Payments, so
// auto-renew state is a fact instead of an assumption.
//
// Base44 Payments exposes a subscription by id (the subscriptionInfo.id stored on
// the purchase by the ORDER_APPROVED webhook) and reports its status: ACTIVE,
// PAUSED, PENDING, CANCELED or ENDED. That status is what decides renewal:
//   • CANCELED / ENDED — the subscription is over, nothing will renew
//   • ACTIVE / PAUSED  — it keeps renewing, with one exception the status cannot
//                        show: a soft cancellation turns auto-renew off while the
//                        subscription stays ACTIVE until the cycle ends. That is
//                        exactly a stored `false`, so it is kept.
//   • anything else    — no renewal answer, so what is already recorded stands
// If a read ever returns the contract's own flag (cycleAutoRenew), that wins.
//
// Runs weekly (Subscription Renewal Check workflow) and on demand from the admin
// Analytics screen.

const WIX_BASE = 'https://www.wixapis.com/payments/base44/v1/subscriptions';

// Whether this subscription will renew, from what Base44 Payments reports.
// `stored` is the flag already on the purchase — the only record that a soft
// cancellation was applied, since Payments keeps that subscription ACTIVE.
function renewalFlagFor(subscription: any, stored: unknown, status: string): boolean | null {
  const explicit = subscription?.cycleAutoRenew ?? subscription?.autoRenew;
  if (typeof explicit === 'boolean') return explicit;
  if (status === 'CANCELED' || status === 'ENDED') return false;
  if (status === 'ACTIVE' || status === 'PAUSED') return stored === false ? false : true;
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Sign in to refresh subscription status.' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admins only.' }, { status: 403 });
    }

    const apiKey = Deno.env.get('WIX_PAYMENTS_API_KEY');
    const siteId = Deno.env.get('WIX_PAYMENTS_SITE_ID');
    if (!apiKey || !siteId) {
      console.error('sync-subscription-renewal: missing Base44 Payments credentials');
      return Response.json({ error: 'Payments is not configured.' }, { status: 500 });
    }

    const paid = await base44.asServiceRole.entities.Base44Purchase.filter({ status: 'paid' });
    const withSubscription = (paid || []).filter((p: any) => !!p.subscriptionId);

    const now = new Date().toISOString();
    const totals = { checked: 0, active: 0, autoRenewOff: 0, autoRenewUnknown: 0, failed: 0 };
    const updates: any[] = [];

    for (const purchase of withSubscription) {
      try {
        const res = await fetch(`${WIX_BASE}/${purchase.subscriptionId}`, {
          method: 'GET',
          headers: { Authorization: apiKey, 'wix-site-id': siteId },
        });

        if (!res.ok) {
          totals.failed++;
          const detail = await res.text().catch(() => '');
          console.error('sync-subscription-renewal: read failed', {
            subscriptionId: purchase.subscriptionId,
            status: res.status,
            detail,
          });
          continue;
        }

        const data = await res.json();
        const subscription = data?.subscription ?? {};
        const status = typeof subscription.status === 'string'
          ? subscription.status.toUpperCase()
          : '';

        const renewalFlag = renewalFlagFor(subscription, purchase.autoRenew, status);

        const update: any = { subscriptionCheckedAt: now };
        if (status) update.subscriptionStatus = status;
        if (typeof renewalFlag === 'boolean') update.autoRenew = renewalFlag;
        updates.push({ id: purchase.id, ...update });

        totals.checked++;
        if (status === 'ACTIVE') totals.active++;

        const effective = typeof renewalFlag === 'boolean' ? renewalFlag : purchase.autoRenew;
        if (effective === false) totals.autoRenewOff++;
        else if (effective !== true) totals.autoRenewUnknown++;
      } catch (err) {
        totals.failed++;
        console.error('sync-subscription-renewal: read threw', {
          subscriptionId: purchase.subscriptionId,
          error: err?.message || err,
        });
      }
    }

    // One write per subscription, batched — keeps the whole run in a couple of round-trips.
    for (let i = 0; i < updates.length; i += 500) {
      await base44.asServiceRole.entities.Base44Purchase.bulkUpdate(updates.slice(i, i + 500));
    }

    console.log('sync-subscription-renewal: done', { ...totals, checkedAt: now });
    return Response.json({ ok: true, ...totals, checkedAt: now });
  } catch (error: any) {
    console.error('sync-subscription-renewal error', error?.message || error);
    return Response.json({ error: 'Could not read subscription state.' }, { status: 500 });
  }
});