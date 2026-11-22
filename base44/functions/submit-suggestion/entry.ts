import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { MAX_SUGGESTIONS_PER_MONTH } from '../../shared/suggestionLimits.ts';

// Stores a user's app-improvement suggestion. Each suggestion is an entry in
// the monthly drawing for a lifetime membership + $100 gift card.
//
// Security: any authenticated user may submit their own suggestion. The record
// is created under the caller's identity (created_by_id) so RLS keeps it
// private to the contributor + admins.

const CATEGORIES = [
  'New feature idea',
  'Improve existing feature',
  'Bug report',
  'Design & usability',
  'Performance',
  'Content & accessibility',
  'Other',
];

function currentMonthKeyChicago() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  return `${y}-${m}`;
}

const MAX_MESSAGE_LENGTH = 2000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const category = String(body.category || '').trim();
    const message = String(body.message || '').trim().slice(0, MAX_MESSAGE_LENGTH);

    if (!CATEGORIES.includes(category)) {
      return Response.json({ error: 'Please pick a category' }, { status: 400 });
    }
    if (message.length < 5) {
      return Response.json({ error: 'Please write a few words about your suggestion' }, { status: 400 });
    }

    // Cap how many suggestions one account can enter in the drawing each month,
    // so a single account cannot flood the pool and capture the monthly prize.
    const monthKey = currentMonthKeyChicago();
    const mine = await base44.entities.AppSuggestion.filter({ monthKey });
    if ((mine?.length || 0) >= MAX_SUGGESTIONS_PER_MONTH) {
      return Response.json(
        { error: 'Thanks for all your suggestions this month! The drawing resets next month.' },
        { status: 429 },
      );
    }

    await base44.entities.AppSuggestion.create({
      category,
      message,
      userEmail: user.email || '',
      userName: user.full_name || '',
      monthKey,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('submit-suggestion error', error?.message || error);
    return Response.json({ error: 'Could not submit this suggestion.' }, { status: 500 });
  }
}