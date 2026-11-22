import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { filterAll } from "../../shared/batchProcess.ts";
import { chargeEmailLookups } from "../../shared/emailProbeBudget.ts";

// Delivers a digital card app-to-app (free tier). Resolves whether the chosen
// contact is also a FinBump user (by email match), creates the Card record as
// the sender, and returns the delivery result. When the contact is not a user,
// delivery is 'unavailable' — the UI explains SMS delivery is a premium path.
// The contact must be the caller's own Person record (RLS-enforced via .get).
//
// Whether that contact is a registered account is the account-existence
// question the app budgets, so the email lookup is charged against the caller's
// shared lookup ledger (the same one check-keepsake-users uses) before it runs.
// Without that, this path would be an unmetered way to test unlimited addresses.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const personId = String(body.personId || '').trim();
    const occasion = String(body.occasion || '').trim();
    const message = String(body.message || '').trim();
    if (!personId || !occasion || !message) {
      return Response.json({ error: 'personId, occasion, and message are required' }, { status: 400 });
    }
    const keywords = String(body.keywords || '').trim();
    const templateKey = String(body.templateKey || '').trim();
    const imageUrl = String(body.imageUrl || '').trim();
    // The signature line the sender chose for their greeting ("Mom", "Grandma
    // Jo"). It is a greeting, never the attribution: a card lands in another
    // real account's inbox wearing whatever name it carries, so who sent it
    // comes from the sender's own account record below, not from the request.
    const senderLabel = String(body.senderLabel || '').trim().slice(0, 60);

    // The contact must belong to the caller (Person RLS allows the owner).
    const person = await base44.entities.Person.get(personId).catch(() => null);
    if (!person) return Response.json({ error: 'Contact not found' }, { status: 404 });

    const email = (person.email || '').trim().toLowerCase();
    let recipientUserId = '';
    let recipientEmail = '';
    let delivery = 'unavailable';
    if (email) {
      const charge = await chargeEmailLookups(base44, user.id, [
        { id: person.id, email, accountCheckCharged: person.accountCheckCharged },
      ]);
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

      const matched = await filterAll(base44.asServiceRole.entities.User, { email });
      if (matched.length) {
        recipientUserId = matched[0].id;
        recipientEmail = email;
        delivery = 'app';
      }
    }

    const displayName = person.preferredName || person.name || '';
    const card = await base44.entities.Card.create({
      occasion,
      message,
      keywords,
      templateKey,
      imageUrl,
      personId,
      personName: displayName,
      recipientUserId,
      recipientEmail,
      senderName: user.full_name || '',
      senderLabel,
      delivery,
      deliveredAt: new Date().toISOString(),
    });

    return Response.json({ cardId: card.id, delivery, recipientName: displayName });
  } catch (error) {
    console.error('send-card failed:', error?.message || error);
    return Response.json({ error: 'Could not send this card.' }, { status: 500 });
  }
}