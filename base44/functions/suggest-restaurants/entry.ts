import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { checkPremiumEntitlement } from '../../shared/entitlement.ts';
import { checkAiRateLimit } from '../../shared/aiRateLimit.ts';

// Finds real restaurants for a gathering from whatever the host can say about it:
// the neighborhood or address, what the occasion is, how many people are coming,
// the food they want, the budget and any notes that matter — including practical
// asks like outdoor dining or margaritas. Web search is on, so the places named
// are real, currently open, and carry their real Yelp and Google ratings so the
// host can judge them. Nothing is stored here — the host picks from the results
// and the chosen place is saved with the meal.

const FIND_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'One short sentence on what was searched for and where' },
    options: {
      type: 'array',
      description: 'Up to four real restaurants, best fit first',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the restaurant' },
          address: { type: 'string', description: 'Full street address' },
          area: { type: 'string', description: 'Neighborhood or district' },
          cuisine: { type: 'string', description: 'Food type, e.g. Italian, Thai, Brunch' },
          priceBand: {
            type: 'string',
            description: 'Typical spend per person',
            enum: ['Under $20', '$20–40', '$40–60', '$60–100', 'Flexible'],
          },
          why: { type: 'string', description: 'Two sentences on why this place suits this gathering' },
          goodFor: { type: 'string', description: 'Short note on the crowd or setting it suits, e.g. groups of 8, patio seating' },
          reserveTip: { type: 'string', description: 'How to get a table, e.g. book a week ahead for weekend dinners' },
          yelpRating: {
            type: 'string',
            description: 'Real Yelp star rating out of 5, e.g. "4.5". "Not listed" when Yelp has no rating — never guessed.',
          },
          googleRating: {
            type: 'string',
            description: 'Real Google star rating out of 5, e.g. "4.7". "Not listed" when Google has no rating — never guessed.',
          },
        },
        required: ['name', 'address', 'why'],
      },
    },
  },
  required: ['options'],
};

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Group meals are a premium feature, so finding a place is gated the same way.
    let isPremium = user.role === 'admin';
    if (!isPremium) {
      const entitlement = await checkPremiumEntitlement(base44.asServiceRole, user.id, user.email);
      isPremium = entitlement.isPremium;
      if (!isPremium) return Response.json({ error: 'Premium required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const area = clean(body.area, 160);
    const address = clean(body.address, 200);
    if (!area && !address) {
      return Response.json({ error: 'Add a neighborhood or an address' }, { status: 400 });
    }

    const occasion = clean(body.occasion, 120);
    const notes = clean(body.notes, 300);
    const budget = clean(body.budget, 40);
    const partySize = Math.min(Math.max(Number(body.partySize) || 0, 0), 30);
    const cuisines = (Array.isArray(body.cuisines) ? body.cuisines : [])
      .map((c: any) => clean(c, 40))
      .filter(Boolean)
      .slice(0, 3);

    await checkAiRateLimit(base44, user.id, 'restaurant-find', isPremium).then((limit) => {
      if (!limit.allowed) {
        throw Object.assign(new Error(`Daily limit reached (${limit.limit} per day). Try again tomorrow.`), { status: 429 });
      }
      return limit;
    });

    const details = [
      area ? `Neighborhood / area: ${area}` : '',
      address ? `Near this address: ${address}` : '',
      occasion ? `Occasion: ${occasion}` : '',
      partySize ? `How many people: ${partySize}` : '',
      cuisines.length ? `Food they want: ${cuisines.join(', ')}` : '',
      budget ? `Budget per person: ${budget}` : '',
      notes ? `Other things that matter: ${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = [
      'Someone is choosing where to eat and needs real places to pick from.',
      '',
      'What they told you:',
      details,
      '',
      'Rules:',
      '- Use web search, and recommend only real, currently operating restaurants or cafes.',
      '- Give each one its real street address, and the neighborhood it sits in.',
      '- Put the places closest to the area or address given first. If the area was vague, say what you assumed in the summary.',
      '- Match the occasion and the group size: a birthday dinner for twelve is not a counter-seat cafe.',
      '- Respect the food type and the budget band they gave.',
      '- For every place you suggest, look up its current Yelp and Google star ratings — search the restaurant by name on Yelp and on Google Maps if that is what it takes. Report the numbers you actually find, like "4.5". Write "Not listed" only when a rating cannot be found at all, and never guess a number. Prefer places rated 4.0 and above, and leave out one that is consistently rated below that.',
      '- "Other things that matter" may be a note written for the group rather than a request: honour any concrete need inside it — outdoor dining, margaritas, a quiet room, a step-free entrance — as a requirement the place must actually meet, and ignore pure pleasantries.',
      '- "why" must be specific — what makes this place right for these people and this occasion.',
      '- Offer up to four options, best fit first, and never more than four.',
      'Return only the JSON object.',
    ]
      .filter(Boolean)
      .join('\n');

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: FIND_SCHEMA,
    });

    const options = Array.isArray(result?.options) ? result.options.slice(0, 4) : [];
    return Response.json({ summary: clean(result?.summary, 300), options });
  } catch (error: any) {
    console.error('suggest-restaurants failed:', error?.message || error);
    return Response.json(
      { error: error?.message || 'Could not find restaurants' },
      { status: error?.status || 500 },
    );
  }
}