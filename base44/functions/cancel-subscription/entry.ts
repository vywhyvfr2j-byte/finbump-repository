import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { calculateProration, getPlanConfig } from "../../shared/cancellationProration.ts";

// Creates a cancellation request for admin approval. Calculates a prorated
// refund based on the user's subscription start date and the "one day of a
// month includes the whole month" rule — the cancellation is effective at
// the end of the current month, and the refund covers the remaining months.
//
// During the 7-day trial: no refund is needed (nothing has been charged yet);
// the request is flagged isTrial=true so the admin can soft-cancel without
// revoking trial access.
//
// The actual Wix cancellation happens in approve-cancellation after the
// admin reviews and approves.

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Sign in to manage your subscription.' }, { status: 401 });
    }

    // Resolve the user's paid subscription purchase (newest first)
    const purchases = await base44.asServiceRole.entities.Base44Purchase.filter({ appUserId: user.id });
    const paid = (purchases || [])
      .filter((p: any) => p.status === 'paid' && p.subscriptionId)
      .sort((a: any, b: any) => (b.paidAt || '').localeCompare(a.paidAt || ''));
    const target = paid[0];
    if (!target) {
      return Response.json({ error: 'No active subscription found to cancel.' }, { status: 404 });
    }

    // Check for existing pending request
    const existing = await base44.asServiceRole.entities.CancelRequest.filter({
      userId: user.id,
      status: 'pending',
    });
    if (existing && existing.length > 0) {
      return Response.json(
        { error: 'You already have a cancellation request pending review.' },
        { status: 409 }
      );
    }

    // Calculate proration (plan-aware: refund is based on the plan's billing cycle)
    const now = new Date().toISOString();
    const planConfig = getPlanConfig(target.productId);
    const proration = calculateProration(target.paidAt, target.trialEndDate, now, planConfig);

    // Create the cancellation request (authenticated user context — RLS
    // requires userId to match the signed-in user)
    const request = await base44.entities.CancelRequest.create({
      userId: user.id,
      userEmail: user.email,
      subscriptionId: target.subscriptionId,
      purchaseId: target.id,
      status: 'pending',
      requestDate: now,
      subscriptionStartDate: target.paidAt,
      trialEndDate: target.trialEndDate,
      isTrial: proration.isTrial,
      monthsUsed: proration.monthsUsed,
      effectiveDate: proration.effectiveDate,
      refundAmount: proration.refundAmount,
      annualPrice: planConfig.price,
    });

    return Response.json({
      ok: true,
      requestId: request.id,
      isTrial: proration.isTrial,
      monthsUsed: proration.monthsUsed,
      refundAmount: proration.refundAmount,
      effectiveDate: proration.effectiveDate,
    });
  } catch (error) {
    console.error('cancel-subscription error', error?.message || error);
    return Response.json({ error: 'Cancellation request failed.' }, { status: 500 });
  }
}