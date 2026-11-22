import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { calculateProration, getPlanConfig } from "../../shared/cancellationProration.ts";

// Admin-only: approves or rejects a pending CancelRequest.
//
// On approve:
//   - Trial cancellation: soft-cancel via Wix (immediate: false) so the user
//     keeps access until the trial ends, then is not charged. No refund needed.
//   - Post-trial cancellation: immediate-cancel via Wix (immediate: true),
//     revoke app access (User.plan → free), and record the prorated refund
//     amount for the developer to process manually through the Wix dashboard.
//
// On reject: simply marks the request as rejected — no changes to the subscription.

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Sign in to approve cancellations.' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Only admins can approve cancellations.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { requestId, action } = body;

    if (!requestId) {
      return Response.json({ error: 'Missing requestId.' }, { status: 400 });
    }
    if (action !== 'approve' && action !== 'reject') {
      return Response.json({ error: 'Invalid action.' }, { status: 400 });
    }

    const requests = await base44.asServiceRole.entities.CancelRequest.filter({ id: requestId });
    const request = requests?.[0];
    if (!request) {
      return Response.json({ error: 'Cancellation request not found.' }, { status: 404 });
    }
    if (request.status !== 'pending') {
      return Response.json({ error: 'Request already processed.' }, { status: 409 });
    }

    // Reject: just mark and return
    if (action === 'reject') {
      await base44.asServiceRole.entities.CancelRequest.update(request.id, {
        status: 'rejected',
        processedAt: new Date().toISOString(),
        processedBy: user.id,
      });
      return Response.json({ ok: true, status: 'rejected' });
    }

    // Re-resolve the authoritative Base44Purchase to verify user-controlled fields.
    // CancelRequest fields are user-writable and could be manipulated by a direct
    // SDK call — we trust only the server-managed Base44Purchase record.
    if (!request.purchaseId) {
      return Response.json({ error: 'Cancellation request has no linked purchase.' }, { status: 400 });
    }
    const purchases = await base44.asServiceRole.entities.Base44Purchase.filter({ id: request.purchaseId });
    const purchase = purchases?.[0];
    if (!purchase) {
      return Response.json({ error: 'Linked purchase not found.' }, { status: 404 });
    }
    if (purchase.appUserId !== request.userId) {
      return Response.json({ error: 'Purchase does not belong to the requesting user.' }, { status: 403 });
    }
    if (!purchase.subscriptionId) {
      return Response.json({ error: 'Linked purchase has no subscription.' }, { status: 400 });
    }

    // Use authoritative fields from the verified purchase, not user-writable CancelRequest fields
    const subscriptionId = purchase.subscriptionId;
    const now = new Date().toISOString();
    const planConfig = getPlanConfig(purchase.productId);
    const proration = calculateProration(purchase.paidAt, purchase.trialEndDate, now, planConfig);
    const isTrial = proration.isTrial;
    const userId = purchase.appUserId;

    // Approve: cancel the subscription via Wix
    const apiKey = Deno.env.get('WIX_PAYMENTS_API_KEY');
    const siteId = Deno.env.get('WIX_PAYMENTS_SITE_ID');
    if (!apiKey || !siteId) {
      console.error('approve-cancellation: missing Wix payments credentials');
      return Response.json({ error: 'Cancellation is not configured.' }, { status: 500 });
    }

    const cancelUrl = `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscriptionId}/cancel`;
    const immediate = !isTrial;

    const wixRes = await fetch(cancelUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
        'wix-site-id': siteId,
      },
      body: JSON.stringify({
        subscription_id: subscriptionId,
        reason: 'User requested cancellation with prorated refund. Approved by admin.',
        immediate,
      }),
    });

    if (!wixRes.ok) {
      // Soft-cancel can fail if auto-renew is already off — fall back to immediate
      if (!immediate) {
        const wixRes2 = await fetch(cancelUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: apiKey,
            'wix-site-id': siteId,
          },
          body: JSON.stringify({
            subscription_id: subscriptionId,
            reason: 'User requested cancellation. Approved by admin.',
            immediate: true,
          }),
        });
        if (!wixRes2.ok) {
          console.error('approve-cancellation: Wix cancel failed', await wixRes2.text().catch(() => ''));
          return Response.json({ error: 'Could not cancel the subscription.' }, { status: 502 });
        }
      } else {
        console.error('approve-cancellation: Wix cancel failed', wixRes.status, await wixRes.text().catch(() => ''));
        return Response.json({ error: 'Could not cancel the subscription.' }, { status: 502 });
      }
    }

    // Record what the cancellation did to the subscription: auto-renew is off from this
    // moment. A soft cancel leaves the subscription ACTIVE until the cycle ends, an
    // immediate one ends it now — both mean this subscriber will not renew.
    try {
      await base44.asServiceRole.entities.Base44Purchase.update(purchase.id, {
        autoRenew: false,
        ...(immediate ? { subscriptionStatus: 'CANCELED' } : {}),
        subscriptionCheckedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('approve-cancellation: could not record auto-renew state', err);
      // Don't fail the cancellation — the weekly sync re-reads this subscription.
    }

    // Revoke app access immediately for post-trial cancellations
    if (!isTrial) {
      try {
        await base44.asServiceRole.entities.User.update(userId, { plan: 'free' });
      } catch (err) {
        console.error('approve-cancellation: User.update failed', err);
        // Don't fail — the SUBSCRIPTION_CANCELED webhook will also revoke
      }
    }

    await base44.asServiceRole.entities.CancelRequest.update(request.id, {
      status: 'approved',
      processedAt: new Date().toISOString(),
      processedBy: user.id,
    });

    return Response.json({
      ok: true,
      status: 'approved',
      refundAmount: proration.refundAmount,
      isTrial,
    });
  } catch (error) {
    console.error('approve-cancellation error', error?.message || error);
    return Response.json({ error: 'Approval failed.' }, { status: 500 });
  }
}