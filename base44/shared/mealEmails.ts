// Email rendering and delivery for the group meal planner.
//
// Delivery goes through Resend first (its own sending limits, separate from
// Base44 integration credits); when Resend isn't configured we fall back to the
// platform SendEmail integration. Meal invites reach people who may not have a
// FinBump account at all, so they must go out over the app's own email
// provider — never the SendEmail integration alone.

import { isResendConfigured, sendHtmlEmailViaResend } from "./resendEmail.ts";
import { escapeHtml } from "./escapeHtml.ts";

// The app's own base URL for links we email people. Resolution lives in
// ./appUrl.ts, which only honours the X-Base44-App-Url header when it points at
// an origin this app owns — so a caller can't make an invite link carry a
// participant's private token to a host they control.
export { resolveAppUrl } from "./appUrl.ts";

// 192 bits of randomness — the token is the only thing protecting a
// participant's private response page, so it must not be guessable.
export function generateMealToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function inviteLink(appUrl: string, mealId: string, token: string): string {
  return `${appUrl}/meal-invite?m=${encodeURIComponent(mealId)}&token=${encodeURIComponent(token)}`;
}

// Sends one meal email. Returns true when it went out over either provider.
export async function sendMealEmail(
  db: any,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
  if (isResendConfigured()) {
    const ok = await sendHtmlEmailViaResend(to, subject, html, text);
    if (ok) return true;
  }
  try {
    await db.asServiceRole.integrations.Core.SendEmail({ to, subject, html, text });
    return true;
  } catch (err) {
    console.error(`sendMealEmail failed for ${to}:`, (err as any)?.message || err);
    return false;
  }
}

export type MealLike = {
  title?: string;
  hostName?: string;
  status?: string;
  area?: string;
  cuisine?: string;
  budget?: string;
  notes?: string;
  proposedDate?: string;
  confirmedDate?: string;
  venueName?: string;
  venueAddress?: string;
};

function whenText(meal: MealLike): string {
  const iso = meal.confirmedDate || meal.proposedDate;
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function planRows(meal: MealLike): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const when = whenText(meal);
  if (when) rows.push([meal.confirmedDate ? "When" : "Proposed time", when]);
  if (meal.venueName) {
    rows.push(["Where", meal.venueAddress ? `${meal.venueName} — ${meal.venueAddress}` : meal.venueName]);
  } else if (meal.area) {
    rows.push(["Area", meal.area]);
  }
  if (meal.cuisine) rows.push(["Food", meal.cuisine]);
  if (meal.budget) rows.push(["Budget", meal.budget]);
  return rows;
}

function renderEmail(opts: {
  heading: string;
  intro: string;
  rows: Array<[string, string]>;
  note?: string;
  linkUrl?: string;
  linkLabel?: string;
  footer?: string;
}): string {
  const rowsHtml = opts.rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#8a7d78;font-size:14px;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:6px 0;color:#3a3230;font-size:14px;font-weight:600;">${escapeHtml(v)}</td></tr>`,
    )
    .join("");

  const noteHtml = opts.note
    ? `<p style="margin:18px 0 0;padding:14px 16px;background:#fdf6f2;border-left:3px solid #d98b7a;border-radius:6px;color:#4a3f3c;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(opts.note)}</p>`
    : "";

  const buttonHtml = opts.linkUrl
    ? `<p style="margin:26px 0 6px;"><a href="${escapeHtml(opts.linkUrl)}" style="display:inline-block;background:#d98b7a;color:#fffdfb;text-decoration:none;font-size:15px;font-weight:600;padding:13px 26px;border-radius:10px;">${escapeHtml(opts.linkLabel || "Open")}</a></p>`
    : "";

  const footerHtml = opts.footer
    ? `<p style="margin:26px 0 0;color:#9a8f8b;font-size:12px;line-height:1.5;">${escapeHtml(opts.footer)}</p>`
    : "";

  return `<!DOCTYPE html><html><body style="margin:0;padding:24px 12px;background:#fbf7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="padding:30px 28px 8px;">
<p style="margin:0 0 4px;color:#d98b7a;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">FinBump</p>
<h1 style="margin:0 0 12px;color:#3a3230;font-size:22px;line-height:1.3;">${escapeHtml(opts.heading)}</h1>
<p style="margin:0 0 18px;color:#5c524f;font-size:15px;line-height:1.55;">${escapeHtml(opts.intro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0">${rowsHtml}</table>
${noteHtml}${buttonHtml}${footerHtml}
</td></tr>
<tr><td style="padding:22px 28px 28px;"><p style="margin:0;color:#a89d99;font-size:11px;line-height:1.5;">Sent by FinBump — the memory vault for the people you love.</p></td></tr>
</table></body></html>`;
}

function rowsText(rows: Array<[string, string]>): string {
  return rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
}

export function inviteEmail(opts: {
  meal: MealLike;
  participantName: string;
  linkUrl: string;
}): { subject: string; html: string; text: string } {
  const { meal, participantName, linkUrl } = opts;
  const heading = `${meal.hostName || "Someone"} invited you to ${meal.title || "a meal"}`;
  const intro = `Hi ${participantName}, you're invited to help pick a time and place. Add what works for you and it'll be matched with everyone else's answers.`;
  const rows = planRows(meal);

  const html = renderEmail({
    heading,
    intro,
    rows,
    note: meal.notes,
    linkUrl,
    linkLabel: "Share my preferences",
    footer: "This private link is just for you — don't forward it.",
  });

  const text = [
    heading,
    "",
    intro,
    rows.length ? `\n${rowsText(rows)}` : "",
    meal.notes ? `\nMessage from ${meal.hostName || "the host"}: ${meal.notes}` : "",
    `\nShare your preferences: ${linkUrl}`,
    "",
    "This private link is just for you — don't forward it.",
  ].join("\n");

  return { subject: `${meal.hostName || "You're invited"} — ${meal.title || "grab a meal"}`, html, text };
}

export function confirmedEmail(opts: {
  meal: MealLike;
  participantName: string;
  linkUrl: string;
}): { subject: string; html: string; text: string } {
  const { meal, participantName, linkUrl } = opts;
  const heading = `${meal.title || "Your meal"} is confirmed`;
  const intro = `Hi ${participantName}, everyone's in. Here's the plan.`;
  const rows = planRows(meal);

  const html = renderEmail({
    heading,
    intro,
    rows,
    note: meal.notes,
    linkUrl,
    linkLabel: "See the plan",
    footer: "We'll send you a reminder the day before.",
  });

  const text = [
    heading,
    "",
    intro,
    rows.length ? `\n${rowsText(rows)}` : "",
    meal.notes ? `\nMessage from ${meal.hostName || "the host"}: ${meal.notes}` : "",
    `\nSee the plan: ${linkUrl}`,
    "",
    "We'll send you a reminder the day before.",
  ].join("\n");

  return { subject: `Confirmed: ${meal.title || "your meal"}`, html, text };
}

export function reminderEmail(opts: {
  meal: MealLike;
  participantName: string;
  linkUrl: string;
  needsResponse: boolean;
}): { subject: string; html: string; text: string } {
  const { meal, participantName, linkUrl, needsResponse } = opts;

  const heading = needsResponse
    ? `Still deciding on ${meal.title || "the meal"}?`
    : `Reminder: ${meal.title || "your meal"} is coming up`;
  const intro = needsResponse
    ? `Hi ${participantName}, ${meal.hostName || "the host"} is still waiting on your answer so the group can settle on a time and place.`
    : `Hi ${participantName}, just a nudge so it doesn't slip past.`;
  const rows = planRows(meal);

  const html = renderEmail({
    heading,
    intro,
    rows,
    linkUrl,
    linkLabel: needsResponse ? "Share my preferences" : "See the plan",
    footer: needsResponse
      ? "Don't want these reminders? You can turn them off on that page."
      : "See you there.",
  });

  const text = [
    heading,
    "",
    intro,
    rows.length ? `\n${rowsText(rows)}` : "",
    `\n${needsResponse ? "Share your preferences" : "See the plan"}: ${linkUrl}`,
    "",
    needsResponse ? "Don't want these reminders? You can turn them off on that page." : "See you there.",
  ].join("\n");

  return { subject: heading, html, text };
}