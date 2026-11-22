import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { checkAndRecordAttempt } from "../../shared/codeAttemptLimit.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to pair.' }, { status: 401 });

    // Brute-force protection: cap pairing attempts per user per hour so the
    // 6-char code space cannot be enumerated by repeated guessing.
    const attempt = await checkAndRecordAttempt(base44, user.id, 'connect-pairing', 8);
    if (!attempt.allowed) {
      return Response.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const { code } = await req.json();
    if (!code || !code.trim()) {
      return Response.json({ error: 'Please enter a code' }, { status: 400 });
    }
    const cleanCode = code.trim().toUpperCase();

    if (user.pairingCode && user.pairingCode.toUpperCase() === cleanCode) {
      return Response.json({ error: "You can't pair with your own code" }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.User.filter({ pairingCode: cleanCode });
    const partner = matches[0];
    if (!partner) {
      return Response.json({ error: 'No account found with that code' }, { status: 404 });
    }
    if (partner.id === user.id) {
      return Response.json({ error: "You can't pair with your own code" }, { status: 400 });
    }

    // Guard against hijacking an existing link: if the partner is already
    // connected to a different account, refuse rather than silently overwriting.
    if (partner.partnerUserId && partner.partnerUserId !== user.id) {
      return Response.json({ error: 'That person is already paired with someone else' }, { status: 409 });
    }
    // Symmetric guard for the requesting user.
    if (user.partnerUserId && user.partnerUserId !== partner.id) {
      return Response.json({ error: 'You are already paired with someone else. Unpair first.' }, { status: 409 });
    }

    await base44.asServiceRole.entities.User.update(user.id, { partnerUserId: partner.id });
    // The code is single-use: consume it as it links, so a code that was ever
    // shared (or leaked) can never be replayed to re-link after an unpair. The
    // owner's client issues a fresh code next time the pairing screen is opened.
    await base44.asServiceRole.entities.User.update(partner.id, {
      partnerUserId: user.id,
      pairingCode: null,
    });

    return Response.json({ partnerName: partner.full_name || 'your partner' });
  } catch (error) {
    console.error('connectPairing error', error?.message || error);
    return Response.json({ error: 'Pairing failed. Please try again.' }, { status: 500 });
  }
});