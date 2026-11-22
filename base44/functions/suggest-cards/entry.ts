import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { checkAiRateLimit } from "../../shared/aiRateLimit.ts";
import { checkPremiumEntitlement } from "../../shared/entitlement.ts";

// Narrow, app-specific LLM endpoint for the occasion-card picker. Given a
// person + occasion + tone category, returns short ready-to-send greeting
// card messages. Auth is required — this prevents anonymous console access
// to InvokeLLM which would consume integration credits without a logged-in
// user. Per-user daily cap prevents runaway credit spend.
const VALID_CATEGORIES = ['Funny', 'Romantic', 'Sentimental', 'Serious', 'Age-appropriate', 'Religious', 'Heartfelt'];

const CATEGORY_GUIDANCE = {
  'Funny': 'Make them light and humorous — witty, not cheesy. Keep it safe for the relationship.',
  'Romantic': 'Make them warm and romantic — heartfelt, genuine, never generic.',
  'Sentimental': 'Make them tender and heartfelt — focus on gratitude and what the person means to the user.',
  'Serious': 'Make them sincere and meaningful — thoughtful, not jokey.',
  'Age-appropriate': 'Lean into the age or milestone (e.g. sweet 16, a new decade, over the hill) in a fitting tone for that age.',
  'Religious': 'Offer a gentle faith-flavored blessing or encouragement that is respectful and inclusive of any tradition. Do not assume a specific religion, name a deity, quote scripture, or use proselytizing language. Keep it universal — focus on peace, hope, and being held in thought or prayer in a way anyone could receive.',
  'Heartfelt': 'Make them warm, encouraging, and supportive — sincere comfort and care.',
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Derive premium status from the immutable ledger so a client-side
    // updateMe({ plan: 'premium' }) cannot raise the daily AI rate limit.
    const entitlement = await checkPremiumEntitlement(base44.asServiceRole, user.id, user.email);
    const isPremium = user.role === 'admin' || entitlement.isPremium;
    const rate = await checkAiRateLimit(base44, user.id, 'suggest-cards', isPremium);
    if (!rate.allowed) {
      return Response.json({ error: 'Daily AI limit reached', limit: rate.limit }, { status: 429 });
    }

    const body = await req.json();
    const personName = String(body.personName || '').trim();
    const occasion = String(body.occasion || 'birthday').trim();
    const category = String(body.category || 'Funny').trim();
    if (!personName) return Response.json({ error: 'personName is required' }, { status: 400 });
    if (!VALID_CATEGORIES.includes(category)) return Response.json({ error: 'Invalid category' }, { status: 400 });

    const relation = String(body.relation || '').trim();
    const species = String(body.species || '').trim();
    const ageTurning = Number.isFinite(body.ageTurning) ? Number(body.ageTurning) : null;
    const yearsTogether = Number.isFinite(body.yearsTogether) ? Number(body.yearsTogether) : null;
    const notes = String(body.notes || '').trim();
    const likes = Array.isArray(body.likes)
      ? body.likes.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()).slice(0, 12)
      : [];

    const isCare = occasion === 'prayer support' || occasion === 'health check-in';
    const relationLine = relation ? ` They are the user's ${relation}${species ? ` (${species})` : ''}.` : '';
    const ageLine = (occasion === 'birthday' && ageTurning != null) ? ` They are turning ${ageTurning}.` : '';
    const yearsLine = (occasion === 'anniversary' && yearsTogether != null) ? ` It is their ${yearsTogether}-year anniversary.` : '';
    const likesLine = likes.length ? ` They enjoy: ${likes.join(', ')}.` : '';
    const notesLine = notes
      ? isCare
        ? ` Their current situation: ${notes}.`
        : ` Additional notes about them: ${notes}.`
      : '';
    const guidance = CATEGORY_GUIDANCE[category] || '';
    const relationLower = relation.toLowerCase();
    const isPartnerRelation = ['partner', 'spouse', 'husband', 'wife'].some((t) => relationLower.includes(t));
    const romanticGuard = isPartnerRelation
      ? ''
      : '\nThis is NOT a romantic relationship. Do not use romantic language, undertones, or themes — keep the message warm but appropriate for this relationship.';

    let intro;
    if (isCare) {
      intro = occasion === 'prayer support'
        ? `Write 5 short, ready-to-send encouragement messages from the user to ${personName}, letting them know they are in the user's thoughts and prayers. Weave in their specific situation${notes ? ' described below' : ''} so each message feels personal to their need, not generic.`
        : `Write 5 short, ready-to-send get-well / thinking-of-you messages from the user to ${personName}, checking in on their health and wellbeing. Weave in their specific health situation${notes ? ' described below' : ''} so each message feels personal to what they are going through, not generic.`;
    } else if (occasion === 'anniversary') {
      intro = `Write 5 short, ready-to-send ANNIVERSARY card messages for ${personName}'s anniversary. This celebrates the couple and their relationship — do NOT mention birthdays, age, or getting older. Focus on their bond and the years together.`;
    } else if (occasion === 'Gotcha Day') {
      intro = `Write 5 short, ready-to-send Gotcha Day card messages for ${personName}, celebrating the anniversary of the day they were adopted. Do NOT mention birthdays or age.`;
    } else {
      intro = `Write 5 short, ready-to-send BIRTHDAY card messages for ${personName}'s birthday. Focus on celebrating them${ageTurning != null ? ` and the milestone of the age they're turning` : ''}.`;
    }
    const prompt = `${intro}${relationLine}${ageLine}${yearsLine}${likesLine}${notesLine}\n\nTone/category: ${category}. ${guidance}${romanticGuard}\n\nEach message should be 1-3 sentences, warm, genuine, and specific to this person and this occasion. Tailor the message to who they are — their relationship to the user, their age, and whether they are family. Avoid generic clichés and "dear friend" openers. Return JSON with a "cards" array of objects, each with a "text" string field containing the full message.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: { text: { type: 'string' } },
              required: ['text'],
            },
          },
        },
        required: ['cards'],
      },
    });

    return Response.json({ cards: result.cards || [] });
  } catch (error) {
    console.error('suggest-cards failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}