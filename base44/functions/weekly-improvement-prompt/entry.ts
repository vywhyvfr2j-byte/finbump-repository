import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { listAll } from "../../shared/batchProcess.ts";
import { isResendConfigured, sendHtmlEmailViaResend } from "../../shared/resendEmail.ts";
import { escapeHtml } from "../../shared/escapeHtml.ts";

// Scheduled by the "Bi-Weekly Improvement Prompt" workflow (every Monday 8am
// America/Chicago; the function skips alternating off-weeks so a prompt is
// produced every two weeks). Asks the admin how the app could be improved for
// the average user, based on their basic needs and priorities: generates
// concrete suggestions via the LLM, stores them as an AdminInsight record (so
// they surface as an in-app notification), and emails the admin a stand-alone
// summary with the full recommendations.
//
// Security: requires an admin via base44.auth.me(). The workflow's
// invoke_backend_function activity runs as the platform service role which
// provides an admin-level auth context. Direct calls from non-admins return 403.

const APP_DESCRIPTION = `FinBump is a mobile-first app that helps people nurture their closest relationships. Core features:
- Track birthdays, anniversaries, and pet "gotcha days" with 30/7/3-day reminders.
- Acts of support: recurring and one-time thoughtful actions with completion logging and streaks.
- Connections (people & pets) with timelines, health/prayer/other care check-in cadences, and photo galleries.
- AI gift finder and gift tracker with budgets.
- AI message writer and e-cards delivered in-app.
- Group meal planning with AI restaurant suggestions and RSVPs.
- Personal notes (appreciation journal, evening memory moments) with a memory timeline and year-in-moments view.
- Prayer list, relationship goals/notes, vacation planner.
- Premium tier gates AI gift finder, group meals, vacation planner, chat assistant, and AI message writer.`;

const AVERAGE_USER = `The average user is a busy partner or parent (often 30-55) in a committed relationship or caring for family. They juggle work and household mental load and feel guilty about forgetting important dates or not being thoughtful enough. Their top needs and priorities: (1) never miss a birthday or anniversary, (2) low effort to be thoughtful — small guided nudges, not big to-do lists, (3) reduce cognitive load, (4) feel emotionally connected and seen, (5) privacy — relationship details are sensitive. They are not highly technical; they want warmth, simplicity, and gentle reminders, not complex dashboards.`;

// Returns the current Monday's date key (YYYY-MM-DD) in America/Chicago, so
// each weekly run is idempotent by week.
function chicagoMondayKey() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = fmt.formatToParts(now);
  const y = Number(parts.find((p) => p.type === 'year').value);
  const m = Number(parts.find((p) => p.type === 'month').value) - 1;
  const d = Number(parts.find((p) => p.type === 'day').value);
  const wd = new Date(y, m, d).getDay(); // 0 Sun .. 6 Sat
  const offset = wd === 0 ? -6 : 1 - wd; // days back to Monday
  const monday = new Date(y, m, d + offset);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function buildEmailHtml({ title, summary, suggestions, weekOf }) {
  const cards = (suggestions || []).map((s, i) => {
    const p = s.priority || 'medium';
    const badgeColor = p === 'high' ? '#b91c1c' : p === 'low' ? '#0369a1' : '#b45309';
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr><td style="background:#fcf7f2;border:1px solid #ede5de;border-radius:8px;padding:16px;">
        <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#363032;">${i + 1}. ${escapeHtml(s.title)}</p>
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${badgeColor};text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(p)} priority</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#363032;">${escapeHtml(s.details)}</p>
      </td></tr></table>`;
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bi-weekly improvement ideas</title></head><body style="margin:0;padding:0;background:#fcf7f2;font-family:Inter,Arial,sans-serif;color:#363032;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#d07b6c;padding:18px 28px;border-radius:8px 8px 0 0;">
<span style="font-size:20px;font-weight:700;color:#000;">FinBump</span>
<span style="float:right;font-size:12px;color:#000;opacity:0.8;padding-top:4px;">Cycle of ${escapeHtml(weekOf)}</span>
</td></tr>
<tr><td style="background:#fefcfb;border:1px solid #ede5de;border-top:none;border-radius:0 0 8px 8px;padding:28px;">
<h1 style="margin:0 0 8px;font-size:22px;color:#363032;">${escapeHtml(title)}</h1>
<p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#69595f;">${escapeHtml(summary)}</p>
${cards}
<p style="margin:24px 0 0;font-size:12px;color:#69595f;">Open the FinBump app and tap the improvement-ideas notification to review and act on these.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildEmailText({ title, summary, suggestions, weekOf }) {
  const lines = (suggestions || []).map((s, i) =>
    `${i + 1}. ${s.title} [${s.priority || 'medium'}]\n${s.details}`);
  return `FinBump — Bi-weekly improvement ideas (cycle of ${weekOf})\n\n${title}\n${summary}\n\n${lines.join('\n\n')}`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const weekOf = chicagoMondayKey();

    // Bi-weekly cadence: only produce a prompt on alternating Mondays.
    // Anchor Monday 2026-10-12 (America/Chicago) is an "on" week; Mondays an odd
    // number of weeks after it skip, so a new prompt arrives every two weeks.
    const [yy, mm, dd] = weekOf.split('-').map(Number);
    const mondayDate = new Date(yy, mm - 1, dd);
    const anchor = new Date(2026, 9, 12);
    const weeksSinceAnchor = Math.round((mondayDate.getTime() - anchor.getTime()) / (7 * 86400000));
    if (weeksSinceAnchor % 2 !== 0) {
      return Response.json({ ok: true, skipped: true, biWeeklyOff: true, weekOf });
    }

    // Idempotent: if this Monday's insight already exists, don't duplicate.
    const existing = await base44.asServiceRole.entities.AdminInsight.filter({ weekOf });
    if (existing && existing.length > 0) {
      return Response.json({ ok: true, skipped: true, weekOf, insightId: existing[0].id });
    }

    const prompt = `You are a senior product strategist reviewing a mobile app. Based on the app and its average user below, recommend 4 to 6 concrete improvements the team should make over the next two weeks to better serve that user's basic needs and priorities.

APP:
${APP_DESCRIPTION}

AVERAGE USER:
${AVERAGE_USER}

For each improvement, give a short title, a priority (high / medium / low based on how much it serves the average user's core needs), and a detailed description of the specific change recommended and WHY it matters to this user. Be specific and actionable, not generic. Prefer improvements that reduce friction, deepen emotional connection, or protect privacy over novelty features.`;

    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string', description: "A short headline naming the theme of this cycle's suggestions" },
        summary: { type: 'string', description: '1-3 sentences framing the average user and their top needs and priorities this two-week cycle' },
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              details: { type: 'string', description: 'The specific change recommended and why it matters to the average user' },
            },
            required: ['title', 'details'],
          },
        },
      },
      required: ['title', 'summary', 'suggestions'],
    };

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });

    const title = llm.title || 'Bi-weekly improvement ideas';
    const summary = llm.summary || '';
    const suggestions = Array.isArray(llm.suggestions)
      ? llm.suggestions.map((s) => ({
          title: String(s.title || 'Improvement'),
          priority: ['high', 'medium', 'low'].includes(s.priority) ? s.priority : 'medium',
          details: String(s.details || ''),
        }))
      : [];

    const insight = await base44.asServiceRole.entities.AdminInsight.create({
      weekOf, title, summary, suggestions,
    });

    // Resolve recipient: first admin user's email, fallback to SUPPORT_EMAIL.
    const users = await listAll(base44.asServiceRole.entities.User);
    const adminUser = users.find((u) => u.role === 'admin' && u.email);
    const adminEmail = adminUser?.email || process.env.SUPPORT_EMAIL;

    let sentVia = 'none';
    if (adminEmail) {
      const subject = `FinBump — Bi-weekly improvement ideas (cycle of ${weekOf})`;
      const html = buildEmailHtml({ title, summary, suggestions, weekOf });
      const text = buildEmailText({ title, summary, suggestions, weekOf });
      if (isResendConfigured()) {
        const ok = await sendHtmlEmailViaResend(adminEmail, subject, html, text);
        if (ok) sentVia = 'resend';
      }
      if (sentVia === 'none') {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: adminEmail, subject, html, text });
        sentVia = 'sendemail';
      }
    } else {
      console.error('weekly-improvement-prompt: no admin email or SUPPORT_EMAIL configured');
    }

    return Response.json({
      ok: true, weekOf, insightId: insight.id, sentVia,
      recipient: adminEmail || null, suggestionCount: suggestions.length,
    });
  } catch (error) {
    console.error('weekly-improvement-prompt error', error?.message || error);
    return Response.json({ error: 'Could not generate the weekly improvement prompt.' }, { status: 500 });
  }
}