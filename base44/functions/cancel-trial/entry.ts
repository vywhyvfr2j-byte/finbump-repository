import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Self-serve trial cancellation.
//
// During the 7-day trial nothing has been charged, so there is no refund to
// approve and no reason to make the member wait: the subscription's auto-renew
// is switched off in Base44 Payments (Wix) the moment they ask, which means the
// card on file is never charged when the trial ends. They keep the remaining
// trial days, then access ends.
//
// If the provider refuses a soft cancel (it can, when auto-renew is already off
// or the contract type doesn't support renewal cycles), the subscription is
// ended immediately and access is dropped right away — the member is still never
// charged.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e: any) => (e?.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Sign in to cancel your trial.' }, { status: 401 });
    }

    const apiKey = Deno.env.get('WIX_PAYMENTS_API_KEY');
    const siteId = Deno.env.get('WIX_PAYMENTS_SITE_ID');
    if (!apiKey || !siteId) {
      console.error('cancel-trial: missing Base44 Payments credentials');
      return Response.json({ error: 'Cancellation is not configured.' }, { status: 500 });
    }

    // Only the caller's own purchases, read with the service role so the trial
    // row (which holds the subscription id) is authoritative.
    const purchases = await base44.asServiceRole.entities.Base44Purchase.filter({
      appUserId: user.id,
    });
    const now = Date.now();
    const trial = (purchases || [])
      .filter(
        (p: any) =>
          p.status === 'paid' &&
          p.subscriptionId &&
          p.trialEndDate &&
          new Date(p.trialEndDate).getTime() > now,
      )
      .sort((a: any, b: any) => new Date(b.trialEndDate).getTime() - new Date(a.trialEndDate).getTime())[0];

    if (!trial) {
      return Response.json({ error: 'No trial is running on this account.' }, { status: 404 });
    }
    if (trial.autoRenew === false) {
      // Already cancelled — idempotent, and the card still shows the end date.
      return Response.json({ ok: true, alreadyCanceled: true, trialEndDate: trial.trialEndDate });
    }

    const cancelUrl = `https://www.wixapis.com/payments/base44/v1/subscriptions/${trial.subscriptionId}/cancel`;
    const reason = 'Trial cancelled by the member before any charge.';
    const post = (immediate: boolean) =>
      fetch(cancelUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey,
          'wix-site-id': siteId,
        },
        body: JSON.stringify({ subscription_id: trial.subscriptionId, reason, immediate }),
        signal: AbortSignal.timeout(10000),
      });

    // Soft cancel first: auto-renew off, trial keeps running for the days left.
    let immediate = false;
    let wixRes = await post(false);
    if (!wixRes.ok) {
      console.warn('cancel-trial: soft cancel refused, ending the trial now', wixRes.status);
      immediate = true;
      wixRes = await post(true);
    }
    if (!wixRes.ok) {
      console.error('cancel-trial: Wix cancel failed', wixRes.status, await wixRes.text().catch(() => ''));
      return Response.json({ error: 'Could not cancel the trial. Please try again.' }, { status: 502 });
    }

    await base44.asServiceRole.entities.Base44Purchase.update(trial.id, {
      autoRenew: false,
      ...(immediate ? { subscriptionStatus: 'CANCELED' } : {}),
      subscriptionCheckedAt: new Date().toISOString(),
    });

    if (immediate) {
      // Ended now — take the trial access with it.
      await base44.asServiceRole.entities.User.update(user.id, { plan: 'free' });
    }

    return Response.json({ ok: true, immediate, trialEndDate: trial.trialEndDate });
  } catch (error: any) {
    console.error('cancel-trial error', error?.message || error);
    return Response.json({ error: 'Cancellation failed.' }, { status: 500 });
  }
}