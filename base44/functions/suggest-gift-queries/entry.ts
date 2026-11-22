import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { checkAiRateLimit } from "../../shared/aiRateLimit.ts";
import { hasMemberAccess } from "../../shared/memberAccess.ts";

// Generates personalized shopping search queries for each gift category,
// tailored to a specific person's profile. Called by the PersonGiftsView
// "Gift Options" section to personalize category tile links.
//
// Auth required + per-user daily cap to prevent anonymous credit consumption.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only accounts the app has actually let in may spend AI credits here.
    if (!(await hasMemberAccess(base44, user))) {
      return Response.json({ error: 'FinBump access required' }, { status: 403 });
    }

    const rate = await checkAiRateLimit(base44, user.id, 'suggest-gifts');
    if (!rate.allowed) {
      return Response.json({ error: 'Daily AI limit reached', limit: rate.limit }, { status: 429 });
    }

    const body = await req.json();
    const { prompt } = body;
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          queries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                query: { type: 'string' },
              },
              required: ['category', 'query'],
            },
          },
        },
        required: ['queries'],
      },
    });

    return Response.json({ queries: result.queries || [] });
  } catch (error) {
    console.error('suggest-gift-queries failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}