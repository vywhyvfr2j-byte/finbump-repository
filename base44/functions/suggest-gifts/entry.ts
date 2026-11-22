import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { checkAiRateLimit } from "../../shared/aiRateLimit.ts";
import { hasMemberAccess } from "../../shared/memberAccess.ts";

// Narrow, app-specific LLM endpoint for gift suggestion features
// (Gift Tracker per-category suggestions, AI Gift Finder, and Small Gift
// Suggester). Accepts a fully-built prompt and returns structured gift
// suggestions using web context. Auth is required — this prevents
// anonymous console access to InvokeLLM which would consume integration
// credits without a logged-in user.

// Shopping domains the app is willing to hand back as a tappable product link.
//
// The suggestion prompt is built on the client and the model follows it, so a
// crafted prompt could otherwise make the web-connected model return ANY url —
// and the gift views render that url as a trusted "View item" button. Every
// returned link is therefore validated here, on the server, before it can reach
// a client or be saved: a link on any other host is dropped, and the suggestion
// simply falls back to the app's existing "Find online" search.
const TRUSTED_SHOPPING_DOMAINS = [
  // Marketplaces (incl. the app's affiliate partners)
  'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 'amazon.com.au',
  'etsy.com', 'ebay.com',
  // General retail
  'target.com', 'walmart.com', 'costco.com', 'samsclub.com', 'bestbuy.com',
  'kohls.com', 'macys.com', 'nordstrom.com', 'bloomingdales.com', 'saks.com',
  'tjmaxx.com', 'wayfair.com', 'ikea.com', 'homedepot.com', 'lowes.com', 'zappos.com',
  // Books — used by the ISBN book suggestions
  'barnesandnoble.com', 'bookshop.org', 'booksamillion.com', 'thriftbooks.com',
  'abebooks.com', 'betterworldbooks.com', 'worldofbooks.com', 'powells.com', 'waterstones.com',
  // Jewelry, beauty, clothing, outdoors
  'zales.com', 'kay.com', 'bluenile.com', 'sephora.com', 'ulta.com', 'lush.com',
  'nike.com', 'adidas.com', 'gap.com', 'jcrew.com', 'anthropologie.com',
  'urbanoutfitters.com', 'rei.com', 'llbean.com', 'patagonia.com', 'thenorthface.com',
  // Tech, hobby and home
  'apple.com', 'samsung.com', 'sony.com', 'dyson.com', 'lego.com', 'shopdisney.com',
  'uncommongoods.com', 'crateandbarrel.com', 'potterybarn.com', 'williams-sonoma.com',
  'bathandbodyworks.com',
  // Experiences and food gifts
  'ticketmaster.com', 'stubhub.com', 'seatgeek.com', 'airbnb.com', 'expedia.com',
  'viator.com', 'groupon.com', 'goldbelly.com', 'harryanddavid.com', '1800flowers.com', 'ftd.com',
  // Pets, crafts, personalized gifts, garden and home
  'chewy.com', 'petco.com', 'petsmart.com', 'michaels.com', 'joann.com',
  'zazzle.com', 'shutterfly.com', 'gardeners.com', 'burpee.com',
  'westelm.com', 'bedbathandbeyond.com',
];

// Returns a normalized http(s) url on a trusted shopping domain, or '' when the
// value is missing, malformed, uses a non-web scheme (javascript:, data:, …) or
// points anywhere else.
function trustedShoppingLink(value: unknown): string {
  if (typeof value !== 'string') return '';
  const raw = value.trim();
  if (!raw || raw.length > 500) return '';
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return '';
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const trusted = TRUSTED_SHOPPING_DOMAINS.some(
    (domain) => host === domain || host.endsWith('.' + domain),
  );
  return trusted ? url.toString() : '';
}

// Estimated budget as a number, ignoring anything the model returns that is not
// a usable amount.
function toBudget(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only accounts the app has actually let in may spend AI credits here.
    if (!(await hasMemberAccess(base44, user))) {
      return Response.json({ error: 'FinBump access required' }, { status: 403 });
    }

    // Per-user daily cap to prevent runaway credit spend.
    const rate = await checkAiRateLimit(base44, user.id, 'suggest-gifts');
    if (!rate.allowed) {
      return Response.json({ error: 'Daily AI limit reached', limit: rate.limit }, { status: 429 });
    }

    const body = await req.json();
    const { prompt, includeCategory, shoppingLocations, category } = body;
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Append shopping-location steering to the client-built prompt. The AI
    // still researches broadly (add_context_from_internet stays true) but
    // prioritizes linking to 1–2 of the user's preferred stores when possible.
    const locations = Array.isArray(shoppingLocations)
      ? shoppingLocations.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
      : [];
    const shoppingLine = locations.length > 0
      ? ` When providing product links, prioritize finding gifts from 1 or 2 of these preferred shopping locations: ${locations.join(', ')}. Still research broadly across the web to find the best ideas, but try to link to products available at these stores when possible.`
      : '';

    // For book recommendations, always offer a specific title by ISBN unless
    // the recipient is a child or the request is for a romance book. The LLM
    // resolves the title and a purchase link from the ISBN via web context.
    // If the book is already among the previously-saved/avoid-repeating ideas
    // (the user asking for additional options), it is not relisted.
    const bookLine = String(category).toLowerCase() === 'books'
      ? ` IMPORTANT: Always include the book with Paperback ISBN 979-8-90445-003-8 (Ebook ISBN 979-8-90445-019-9) as one of your suggestions — look up its exact title and a direct purchase link by its ISBN. Do NOT include this book if the recipient is a child, or if the request is specifically for a romance book. If this book already appears among the previously saved or avoid-repeating ideas (i.e., the user is asking for additional options), do not list it again.`
      : '';

    const fullPrompt = prompt + shoppingLine + bookLine;

    const itemProperties = {
      title: { type: 'string' },
      ...(includeCategory ? { category: { type: 'string' } } : {}),
      reason: { type: 'string' },
      budget: { type: 'number' },
      link: { type: 'string' },
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: itemProperties,
              required: ['title'],
            },
          },
        },
        required: ['suggestions'],
      },
    });

    // Rebuild every suggestion field explicitly so only known, sanitized values
    // reach the client: this is the trust boundary between model output (which a
    // client-supplied prompt can steer) and what the app renders and saves.
    const suggestions = Array.isArray(result?.suggestions) ? result.suggestions : [];
    return Response.json({
      suggestions: suggestions.slice(0, 12).map((s) => ({
        title: String(s?.title || '').slice(0, 200),
        ...(includeCategory ? { category: String(s?.category || '').slice(0, 60) } : {}),
        reason: String(s?.reason || '').slice(0, 400),
        budget: toBudget(s?.budget),
        link: trustedShoppingLink(s?.link),
      })),
    });
  } catch (error) {
    console.error('suggest-gifts failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}