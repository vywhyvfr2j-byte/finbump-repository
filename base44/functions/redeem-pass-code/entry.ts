import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { checkAndRecordAttempt } from "../../shared/codeAttemptLimit.ts";

// Redeems a shareable pass code. The recipient enters a code issued by a
// purchaser; if it exists and hasn't been used, the recipient is granted
// Premium (1 year for an annual pass, 1 month for a monthly pass) and the
// code is stamped as used.
//
// Also runs an auto-expiry check on the calling user: if their monthly pass
// has expired, their plan reverts to "free". This runs on every call so the
// app can trigger it on load by calling with no code.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });

    // ---- Auto-expire monthly passes ----
    let expired = false;
    if ((user.plan === 'premium' || user.plan === 'basic') && user.passExpiresAt) {
      const exp = new Date(user.passExpiresAt);
      if (exp.getTime() < Date.now()) {
        await base44.asServiceRole.entities.User.update(user.id, { plan: 'free', passExpiresAt: null });
        expired = true;
      }
    }

    const body = await req.json().catch(() => ({}));
    const code = (body?.code || '').trim().toUpperCase();
    // No code = expiry-check-only call (used on app load). Return current plan.
    if (!code) {
      return Response.json({ ok: true, expired, plan: expired ? 'free' : user.plan });
    }

    // Brute-force protection: cap redemption attempts per user per hour so
    // pass codes cannot be guessed by repeated submission.
    const attempt = await checkAndRecordAttempt(base44, user.id, 'redeem-pass-code', 10);
    if (!attempt.allowed) {
      return Response.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const matches = await base44.asServiceRole.entities.PassCode.filter({ code });
    const passCode = matches?.[0];
    if (!passCode) return Response.json({ error: 'That code is not valid.' }, { status: 404 });

    // Atomically claim the code only when it is still unused, so concurrent
    // redemption attempts cannot both pass a read-then-write usedBy check and
    // each grant premium from a single-use code.
    const now = new Date();
    const claimRes = await base44.asServiceRole.entities.PassCode.updateMany(
      { id: passCode.id, usedBy: null },
      { $set: { usedBy: user.id, usedAt: now.toISOString() } },
    );
    if (Number(claimRes?.updated ?? 0) === 0) {
      return Response.json({ error: 'That code has already been used.' }, { status: 409 });
    }

    // Grant Premium. Monthly passes set an expiry timestamp.
    const userUpdate = { plan: 'premium' };
    if (passCode.passType === 'monthly') {
      userUpdate.passExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    await base44.asServiceRole.entities.User.update(user.id, userUpdate);

    return Response.json({ ok: true, passType: passCode.passType, expired });
  } catch (error) {
    console.error('redeem-pass-code error', error?.message || error);
    return Response.json({ error: 'Could not redeem this code.' }, { status: 500 });
  }
}