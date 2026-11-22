import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { waitUntil } from 'base44:runtime';
import { checkAndRecordAttempt } from '../../shared/codeAttemptLimit.ts';
import { checkPremiumEntitlement } from '../../shared/entitlement.ts';
import { generateMealToken, inviteEmail, inviteLink, resolveAppUrl, sendMealEmail } from '../../shared/mealEmails.ts';
import { canEmailInvite, contactsOnlyError, inviteTrustForCaller, isInviteable, notEmailedWarning } from '../../shared/inviteRecipients.ts';

// Creates a group meal, generates a private token per invitee, and emails each
// of them a personal link to share their availability and food preferences.
// Premium feature — verified against the immutable purchase/pass ledgers rather
// than the client-writable User.plan field.

const MAX_PARTICIPANTS = 12;
// Every gathering emails up to MAX_PARTICIPANTS invitations, so cap how many a
// single account can create per day: that bounds the invite-email volume and
// the number of addresses one account can push mail to.
const MAX_MEALS_PER_DAY = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bound(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function isoOrUndefined(value: unknown): string | undefined {
  if (!value) return undefined;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
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

    // Rate limit: cap gatherings per host per day, which caps the invite emails
    // (and the invited addresses) a single account can send.
    const attempt = await checkAndRecordAttempt(base44, user.id, 'create-meal', MAX_MEALS_PER_DAY, 1440);
    if (!attempt.allowed) {
      return Response.json(
        { error: 'You have created a lot of gatherings today. Please try again tomorrow.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const title = bound(body.title, 120);
    if (!title) return Response.json({ error: 'Give this meal a name' }, { status: 400 });

    const seen = new Set<string>();
    const participants: any[] = [];
    const incoming = Array.isArray(body.participants) ? body.participants.slice(0, MAX_PARTICIPANTS) : [];
    for (const raw of incoming) {
      const name = bound(raw?.name, 80);
      const email = bound(raw?.email, 200).toLowerCase();
      if (!name || !EMAIL_RE.test(email) || seen.has(email)) continue;
      seen.add(email);
      participants.push({
        id: `p_${generateMealToken().slice(0, 12)}`,
        name,
        email,
        personId: bound(raw?.personId, 64),
        token: generateMealToken(),
        invitedAt: new Date().toISOString(),
        reminderOptOut: false,
      });
    }
    if (participants.length < 1) {
      return Response.json({ error: 'Add someone with a valid email address to invite' }, { status: 400 });
    }

    // Only the host's own connections can be invited: an address must be one of
    // their saved Person records, or their paired partner. An address typed in by
    // hand is refused here, before anything is stored or sent, so this route can
    // never reach someone the host has not actually connected with.
    const trust = await inviteTrustForCaller(base44, user);
    const outside = participants.filter((p) => !isInviteable(trust, p.email));
    if (outside.length) {
      return Response.json({ error: contactsOnlyError(outside.map((p) => p.name)) }, { status: 400 });
    }

    // No address-to-account lookup happens here. Invitees answer through their
    // own emailed token link, so nothing needs to know whether an invited
    // address belongs to an account — and resolving invitee emails against the
    // User table would hand an authenticated host an account-existence oracle
    // that the check-keepsake-users budget exists to bound.
    // A planned menu is a bounded list of short dish names — bound and de-duped so
    // a pasted blob can't bloat the record or the invite email.
    const menuItems: string[] = [];
    if (Array.isArray(body.menuItems)) {
      for (const raw of body.menuItems.slice(0, 20)) {
        const item = bound(raw, 80);
        if (item && !menuItems.includes(item)) menuItems.push(item);
      }
    }

    const meal = await base44.entities.Meal.create({
      title,
      hostName: bound(user.full_name, 80),
      status: 'proposed',
      area: bound(body.area, 120),
      cuisine: bound(body.cuisine, 120),
      budget: bound(body.budget, 40),
      // The place the host settled on (often one the AI found for them), kept with
      // the meal so the card and the confirm form already know where it is.
      venueName: bound(body.venueName, 120),
      venueAddress: bound(body.venueAddress, 200),
      proposedDate: isoOrUndefined(body.proposedDate),
      notes: bound(body.notes, 1000),
      menuItems,
      participants,
      remindersSent: 0,
    });

    // The invite list comes from the request body, so an address is only emailed
    // when the app can confirm it belongs to someone genuinely connected to this
    // host (see shared/inviteRecipients.ts) — otherwise any account could type in
    // a stranger's address and have FinBump mail it. Everyone invited keeps their
    // record and private link; the host shares the rest themselves.
    const emailRecipients: any[] = [];
    for (const p of participants) {
      if (await canEmailInvite(trust, p.email)) emailRecipients.push(p);
    }
    const notEmailed = participants.length - emailRecipients.length;

    const appUrl = resolveAppUrl(req);
    if (appUrl) {
      // Deliver after responding so a slow mail provider can't hold up the app.
      // Resend rate-limits per second, so pace the sends.
      waitUntil(
        (async () => {
          for (const p of emailRecipients) {
            const linkUrl = inviteLink(appUrl, meal.id, p.token);
            const { subject, html, text } = inviteEmail({ meal, participantName: p.name, linkUrl });
            await sendMealEmail(base44, p.email, subject, html, text);
            await new Promise((r) => setTimeout(r, 400));
          }
        })(),
      );
    } else {
      console.error('create-meal: no app URL (X-Base44-App-Url header and WIX_CHECKOUT_APP_URL both empty) — invite emails skipped');
    }

    return Response.json({
      meal,
      inviteCount: participants.length,
      inviteWarning: appUrl
        ? notEmailedWarning(notEmailed, 'meal')
        : 'The invitations could not be emailed because the app URL is not configured. You can still copy each person\'s private link from the meal page.',
    });
  } catch (error: any) {
    console.error('create-meal failed:', error?.message || error);
    return Response.json({ error: 'Could not create this meal' }, { status: 500 });
  }
}