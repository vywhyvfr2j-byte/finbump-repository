import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { checkAndRecordAttempt } from '../../shared/codeAttemptLimit.ts';
import { checkPremiumEntitlement } from '../../shared/entitlement.ts';
import { resolveAppUrl, tripInviteLink, tripInviteEmail, generateTripToken, sendTripEmail } from '../../shared/tripEmails.ts';
import { canEmailInvite, contactsOnlyError, inviteTrustForCaller, isInviteable, notEmailedWarning } from '../../shared/inviteRecipients.ts';

// Invites connections to collaborate on a trip. Upserts the Trip entity by its
// stable client id, generates a private token per traveler, and emails each of
// them a personal link to share their travel preferences. Premium feature.

const MAX_TRAVELERS = 12;
const MAX_TRIPS_PER_DAY = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bound(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function isoOrEmpty(value: unknown): string {
  if (!value) return '';
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? '' : (value as string);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin') {
      const { isPremium } = await checkPremiumEntitlement(base44.asServiceRole, user.id, user.email);
      if (!isPremium) return Response.json({ error: 'Premium required' }, { status: 403 });
    }

    const attempt = await checkAndRecordAttempt(base44, user.id, 'create-trip-invites', MAX_TRIPS_PER_DAY, 1440);
    if (!attempt.allowed) {
      return Response.json(
        { error: 'You have sent a lot of trip invitations today. Please try again tomorrow.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const tripId = bound(body.tripId, 64);
    const name = bound(body.name, 120);
    if (!tripId || !name) return Response.json({ error: 'A trip id and name are required' }, { status: 400 });

    const destination = bound(body.destination, 200);
    const startDate = isoOrEmpty(body.startDate);
    const endDate = isoOrEmpty(body.endDate);
    const notes = bound(body.notes, 1000);
    const hostName = bound(body.hostName || user.full_name, 80);

    // Build the new traveler list. Existing travelers (already invited) are kept
    // with their responses intact; new ones get fresh tokens.
    const existing = await base44.asServiceRole.entities.Trip.filter({ tripId });
    if (existing.length && existing[0].created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'You can only invite people to your own trips.' }, { status: 403 });
    }
    let travelers: any[] = [];
    if (existing.length) travelers = [...(existing[0].travelers || [])];

    const seenEmail = new Set(travelers.map((t: any) => (t.email || '').toLowerCase()));
    const incoming = Array.isArray(body.invitees) ? body.invitees.slice(0, MAX_TRAVELERS) : [];
    const newlyAdded: any[] = [];
    for (const raw of incoming) {
      const tName = bound(raw?.name, 80);
      const email = bound(raw?.email, 200).toLowerCase();
      if (!tName || !EMAIL_RE.test(email) || seenEmail.has(email)) continue;
      seenEmail.add(email);
      const t = {
        id: `tv_${generateTripToken().slice(0, 12)}`,
        name: tName,
        email,
        personId: bound(raw?.personId, 64),
        token: generateTripToken(),
        role: raw?.role === 'viewer' ? 'viewer' : 'editor',
        invitedAt: new Date().toISOString(),
        reminderOptOut: false,
      };
      travelers.push(t);
      newlyAdded.push(t);
    }
    if (newlyAdded.length === 0 && travelers.length === 0) {
      return Response.json({ error: 'Add someone with a valid email address to invite' }, { status: 400 });
    }

    // Same rule as a meal: only the host's own connections (saved Person records
    // or their paired partner) can be added as travelers, so a typed-in address
    // is refused before the trip is written or any mail goes out.
    const trust = await inviteTrustForCaller(base44, user);
    const outside = newlyAdded.filter((t: any) => !isInviteable(trust, t.email));
    if (outside.length) {
      return Response.json({ error: contactsOnlyError(outside.map((t: any) => t.name)) }, { status: 400 });
    }

    const payload: any = {
      name,
      destination,
      startDate,
      endDate,
      notes,
      hostName,
      status: 'planning',
      travelers,
    };

    let tripEntityId: string;
    if (existing.length) {
      tripEntityId = existing[0].id;
      await base44.asServiceRole.entities.Trip.update(tripEntityId, payload);
    } else {
      const created = await base44.entities.Trip.create({ tripId, ...payload });
      tripEntityId = created.id;
    }

    // Only addresses the app can confirm belong to someone connected to this host
    // are emailed: the invite list arrives in the request body, so auto-sending to
    // a typed-in address would turn the app's mail provider into a way to reach
    // strangers. Everyone added keeps their traveler record and private link,
    // shared by the host.
    const emailRecipients: any[] = [];
    for (const t of newlyAdded) {
      if (await canEmailInvite(trust, t.email)) emailRecipients.push(t);
    }
    const notEmailed = newlyAdded.length - emailRecipients.length;

    const appUrl = resolveAppUrl(req);
    if (appUrl && emailRecipients.length) {
      const trip = { name, destination, startDate, endDate, notes, hostName };
      waitUntil(
        (async () => {
          for (const t of emailRecipients) {
            const linkUrl = tripInviteLink(appUrl, tripId, t.token);
            const { subject, html, text } = tripInviteEmail({ trip, travelerName: t.name, linkUrl });
            await sendTripEmail(base44, t.email, subject, html, text);
            await new Promise((r) => setTimeout(r, 400));
          }
        })(),
      );
    } else if (!appUrl) {
      console.error('create-trip-invites: no app URL — invite emails skipped');
    }

    return Response.json({
      id: tripEntityId,
      travelers: travelers.map((t: any) => ({ id: t.id, name: t.name, email: t.email, role: t.role, invitedAt: t.invitedAt, respondedAt: t.respondedAt || '' })),
      inviteCount: newlyAdded.length,
      inviteWarning: appUrl
        ? notEmailedWarning(notEmailed, 'trip')
        : 'The invitations could not be emailed because the app URL is not configured. You can still copy each person\'s private link from the trip.',
    });
  } catch (error: any) {
    console.error('create-trip-invites failed:', error?.message || error);
    return Response.json({ error: 'Could not send these invitations' }, { status: 500 });
  }
}