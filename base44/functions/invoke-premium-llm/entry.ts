import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { checkAiRateLimit } from "../../shared/aiRateLimit.ts";
import { checkPremiumEntitlement } from "../../shared/entitlement.ts";

// Server-side premium gate for AI-powered features.
//
// The client-side FeatureGate only hides the UI — a free user can open the
// browser console and call base44.integrations.Core.InvokeLLM directly,
// consuming AI credits without paying. This function is the real gate:
// it verifies the user's plan server-side before forwarding the call to
// InvokeLLM. Free users get a 403 regardless of how they reach this endpoint.
//
// Premium features (Chat, AI Trip Ideas, Movie Ideas) call this instead of
// InvokeLLM directly. Free features (Voice Quick Capture, Gift Tracker,
// Message Writer) keep calling InvokeLLM directly since they're available
// to all users.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Server-side premium check — queries the immutable purchase/pass ledger
    // instead of the client-writable User.plan / User.lifetimeTier fields.
    const entitlement = await checkPremiumEntitlement(base44.asServiceRole, user.id, user.email);
    const isPremium = user.role === 'admin' || entitlement.isPremium;
    if (!isPremium) {
      return Response.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    // Per-user daily cap to prevent runaway credit spend.
    const rate = await checkAiRateLimit(base44, user.id, 'invoke-premium-llm', isPremium);
    if (!rate.allowed) {
      return Response.json({ error: 'Daily AI limit reached', limit: rate.limit }, { status: 429 });
    }

    const body = await req.json();
    const { prompt, response_json_schema, add_context_from_internet, model } = body;
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Forward to InvokeLLM. The model comes from a short server-side allowlist —
    // a caller cannot pick the app's most expensive model on every request.
    const ALLOWED_MODELS = ['gemini_3_flash', 'automatic'];
    // Bounded so the endpoint stays an app feature, not a general-purpose AI
    // account on the app's credits. Every in-app prompt is far under this cap.
    const MAX_PROMPT_CHARS = 2000;
    const llmArgs = { prompt: prompt.slice(0, MAX_PROMPT_CHARS) };
    if (response_json_schema) llmArgs.response_json_schema = response_json_schema;
    if (add_context_from_internet) llmArgs.add_context_from_internet = true;
    if (typeof model === 'string' && ALLOWED_MODELS.includes(model)) llmArgs.model = model;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM(llmArgs);
    return Response.json(result);
  } catch (error) {
    console.error('invoke-premium-llm failed:', error?.message || error);
    return Response.json({ error: 'Could not complete that request.' }, { status: 500 });
  }
}