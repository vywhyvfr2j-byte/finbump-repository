import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { checkAiRateLimit } from "../../shared/aiRateLimit.ts";
import { hasMemberAccess } from "../../shared/memberAccess.ts";

// Narrow, app-specific LLM endpoint for the Message Writer feature.
// Accepts a fully-built prompt and returns the generated message text.
// Auth is required — this prevents anonymous console access to InvokeLLM
// which would consume integration credits without a logged-in user.
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
    const rate = await checkAiRateLimit(base44, user.id, 'generate-message');
    if (!rate.allowed) {
      return Response.json({ error: 'Daily AI limit reached', limit: rate.limit }, { status: 429 });
    }

    const body = await req.json();
    const { prompt } = body;
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Bounded so one member cannot use this endpoint as a general-purpose AI
    // account on the app's credits. The Message Writer's own prompts are well
    // under this cap.
    const MAX_PROMPT_CHARS = 2000;
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt.slice(0, MAX_PROMPT_CHARS),
    });
    return Response.json({ message: result });
  } catch (error) {
    console.error('generate-message failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}