import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to unpair.' }, { status: 401 });

    if (!user.partnerUserId) {
      return Response.json({ error: 'You are not paired.' }, { status: 400 });
    }

    const partnerId = user.partnerUserId;

    // Unpairing must revoke the link, not merely hide it: the pairing code is
    // what authorizes a re-link, so it is cleared on BOTH accounts too. Without
    // that, an ex-partner who still holds the old code could silently call
    // connectPairing again and regain access to private data. The client issues
    // a fresh code the next time the pairing screen is opened.
    await base44.asServiceRole.entities.User.update(user.id, {
      partnerUserId: null,
      pairingCode: null,
    });

    // Only clear the partner's link if it genuinely points back at the caller
    // (reciprocal-consent check). partnerUserId is client-settable via updateMe,
    // so without this check a user could point their partnerUserId at any victim
    // and call unpair to silently erase that victim's existing pairing.
    const partner = await base44.asServiceRole.entities.User.get(partnerId).catch(() => null);
    if (partner && partner.partnerUserId === user.id) {
      await base44.asServiceRole.entities.User.update(partnerId, {
        partnerUserId: null,
        pairingCode: null,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('unpair error', error?.message || error);
    return Response.json({ error: error?.message || 'Unpair failed.' }, { status: 500 });
  }
});