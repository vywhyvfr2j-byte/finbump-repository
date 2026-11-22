import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { checkAiRateLimit } from "../../shared/aiRateLimit.ts";
import { checkPremiumEntitlement } from "../../shared/entitlement.ts";

// Premium-only AI card background generator. Builds a decorative,
// text-free illustration prompt from the occasion + optional keywords,
// forwards it to the GenerateImage integration, and returns the image URL.
//
// The server-side premium check is the authoritative gate — the client UI
// only hides the button. Free users get a 403 regardless of how they reach
// this endpoint, so AI credits can't be spent without a paid plan.
const OCCASION_ART: Record<string, string> = {
  birthday: 'a soft, festive birthday scene — pastel balloons, gentle confetti, warm joyful light',
  anniversary: 'a romantic anniversary scene — soft roses, golden candlelight, elegant and tender',
  prayer: 'a serene prayer and spiritual support scene — soft candlelight, gentle folded hands, calming and reverent',
  getwell: 'a gentle get-well scene — soft green leaves, morning light, healing and hopeful',
  graduation: 'a proud graduation scene — soft graduation cap and golden tassel, bright and celebratory',
  thankyou: 'a warm thank-you scene — soft gratitude, golden tones, heartfelt and gentle',
  thinking: 'a dreamy thinking-of-you scene — soft clouds, pastel sky, wistful and tender',
  justbecause: 'a cheerful just-because scene — soft abstract pastel shapes, playful and warm',
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Server-side premium gate — queries the immutable purchase/pass ledger
    // instead of the client-writable User.plan / User.lifetimeTier fields.
    const entitlement = await checkPremiumEntitlement(base44.asServiceRole, user.id, user.email);
    const isPremium = user.role === 'admin' || entitlement.isPremium;
    if (!isPremium) {
      return Response.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    // Per-user daily cap to prevent runaway credit spend.
    const rate = await checkAiRateLimit(base44, user.id, 'generate-card-art', isPremium);
    if (!rate.allowed) {
      return Response.json({ error: 'Daily AI limit reached', limit: rate.limit }, { status: 429 });
    }

    const body = await req.json();
    const occasion = String(body.occasion || '').trim();
    const keywords = String(body.keywords || '').trim();
    const base = OCCASION_ART[occasion] || OCCASION_ART.justbecause;
    const kwClause = keywords ? ` Incorporate this theme naturally: ${keywords}.` : '';
    const prompt = `${base}.${kwClause} Decorative greeting-card background illustration. No text, no words, no letters, no typography. Soft painterly style, warm and heartfelt, vertical portrait composition, leaving gentle space for a message.`;

    const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
    return Response.json({ url: result.url });
  } catch (error) {
    console.error('generate-card-art failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}