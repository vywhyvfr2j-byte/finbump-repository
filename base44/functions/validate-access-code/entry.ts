import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { checkAndRecordAttempt } from "../../shared/codeAttemptLimit.ts";

// Redeems a single-use access code. The user enters a code issued by an admin;
// if it exists and hasn't been used yet, the user is marked accessApproved and
// the code is stamped as used. AccessCode records are admin-only via RLS, so
// users can't enumerate codes — they can only validate one they've been given.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const code = (body?.code || '').trim().toUpperCase();
    if (!code) return Response.json({ error: 'Please enter a code.' }, { status: 400 });

    // Brute-force protection: cap access-code attempts per user per hour so
    // the invite-only gate cannot be bypassed by repeated guessing.
    const attempt = await checkAndRecordAttempt(base44, user.id, 'validate-access-code', 8);
    if (!attempt.allowed) {
      return Response.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const matches = await base44.asServiceRole.entities.AccessCode.filter({ code });
    const accessCode = matches?.[0];
    if (!accessCode) return Response.json({ error: 'That code is not valid.' }, { status: 404 });

    // Atomically claim the code only when it is still unused, so concurrent
    // attempts cannot both pass a read-then-write usedBy check and each gain
    // access from a single-use invite code.
    const claimRes = await base44.asServiceRole.entities.AccessCode.updateMany(
      { id: accessCode.id, usedBy: null },
      { $set: { usedBy: user.id, usedAt: new Date().toISOString() } },
    );
    if (Number(claimRes?.updated ?? 0) === 0) {
      return Response.json({ error: 'That code has already been used.' }, { status: 409 });
    }

    // Grant access. The code is already claimed atomically above; a failure
    // here is rare, and the user can request a new invite code if it errors.
    await base44.asServiceRole.entities.User.update(user.id, { accessApproved: true });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('validate-access-code error', error?.message || error);
    return Response.json({ error: error?.message || 'Could not validate code.' }, { status: 500 });
  }
}