import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canEmailInvite, inviteTrustForCaller } from '../../shared/inviteRecipients.ts';
import { checkAndRecordAttempt } from '../../shared/codeAttemptLimit.ts';
import { chargeEmailLookups } from '../../shared/emailProbeBudget.ts';

// The verification step in front of every meal or trip invitation: the host
// sees exactly who will actually receive an email before anything is sent.
//
// It accepts only ids of the caller's OWN Person records. An email address typed
// into the request is never looked up, so this endpoint cannot be pointed at an
// address. The answer is advisory: create-meal and create-trip-invites re-check
// every recipient themselves, so a stale or skipped check can never widen who is
// emailed.
//
// willEmail answers the same question check-keepsake-users answers — does this
// address belong to a real FinBump account — so it is bounded the same way, or
// it would be a way around those limits: calls are rate limited per account, a
// contact must have existed for a day before its address can be probed, and each
// address is charged against the shared EmailProbe ledger (shared/emailProbeBudget.ts)
// before the lookup. Being over budget only means the host is told to share the
// private link, never that an invitation fails.

const MAX_INVITEES = 12;
const MAX_CALLS_PER_HOUR = 30;
// Same contact-age gate as check-keepsake-users: an attacker cannot bulk-create
// Person contacts with harvested addresses and query them in the same burst.
const MIN_CONTACT_AGE_MS = 24 * 60 * 60 * 1000;

function normalise(email: unknown): string {
  return String(email ?? '').trim().toLowerCase();
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const attempt = await checkAndRecordAttempt(
      base44, user.id, 'verify-invitees', MAX_CALLS_PER_HOUR, 60,
    );
    if (!attempt.allowed) {
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const raw = Array.isArray(body?.personIds) ? body.personIds : [];
    // Only real record ids are accepted — anything else (an email address, junk)
    // is dropped before the query, so this can neither be pointed at an address
    // nor made to fail on bad input.
    const personIds = raw
      .slice(0, MAX_INVITEES)
      .map((id: any) => String(id || '').trim())
      .filter((id: string) => /^[a-f0-9]{24}$/i.test(id));
    if (personIds.length === 0) return Response.json({ invitees: [], emailed: 0, shared: 0 });

    // Pinned to the caller as the owner: another account's contacts are invisible
    // here even for an admin.
    const people = await base44.asServiceRole.entities.Person.filter({
      created_by_id: user.id,
      id: { $in: personIds },
    });

    const trust = await inviteTrustForCaller(base44, user);

    // Which of these addresses actually need an account lookup: the host's own
    // address and their paired partner resolve without one, and a contact must
    // be at least a day old before its address can be probed.
    const nowMs = Date.now();
    const probeable = (people || []).filter((person: any) => {
      const email = normalise(person?.email);
      if (!email) return false;
      if (email === trust.ownEmail || email === trust.partnerEmail) return false;
      if (!trust.contactEmails.has(email)) return false;
      const created = person.created_date ? new Date(person.created_date).getTime() : 0;
      return nowMs - created >= MIN_CONTACT_AGE_MS;
    });
    const chargedEmails = new Set(probeable.map((p: any) => normalise(p?.email)));

    // Charge BEFORE anything is looked up, against the ledger shared with
    // check-keepsake-users and send-card, so a sweep cannot hop between paths.
    const charge = await chargeEmailLookups(base44, user.id, probeable);
    if (!charge.allowed) {
      return Response.json(
        { error: charge.error },
        {
          status: 429,
          ...(charge.retryAfterSeconds
            ? { headers: { 'Retry-After': String(charge.retryAfterSeconds) } }
            : {}),
        },
      );
    }

    const invitees = await Promise.all(
      (people || []).map(async (person: any) => {
        const email = normalise(person?.email);
        const canCheck =
          email === trust.ownEmail || email === trust.partnerEmail || chargedEmails.has(email);
        return {
          personId: person.id,
          name: person.preferredName || person.name || '',
          email,
          willEmail: canCheck ? await canEmailInvite(trust, email) : false,
        };
      }),
    );

    const emailed = invitees.filter((i) => i.willEmail).length;
    return Response.json({ invitees, emailed, shared: invitees.length - emailed });
  } catch (error: any) {
    console.error('verify-invitees failed:', error?.message || error);
    return Response.json({ error: 'Could not check these invitations' }, { status: 500 });
  }
}