// Email rendering and delivery for the shared trip planner.
//
// Reuses the meal planner's token generator and delivery path (Resend first,
// platform SendEmail fallback) so trip invites reach people who may not have a
// FinBump account at all, over the app's own email provider.

import { generateMealToken, sendMealEmail } from "./mealEmails.ts";
import { escapeHtml } from "./escapeHtml.ts";

export { generateMealToken as generateTripToken };
export { resolveAppUrl } from "./appUrl.ts";

export function tripInviteLink(appUrl: string, tripId: string, token: string): string {
  return `${appUrl}/trip-invite?t=${encodeURIComponent(tripId)}&token=${encodeURIComponent(token)}`;
}

export type TripLike = {
  name?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  hostName?: string;
  status?: string;
};

function dateText(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function whenText(trip: TripLike): string {
  const start = dateText(trip.startDate || "");
  const end = dateText(trip.endDate || "");
  if (start && end && start !== end) return `${start} — ${end}`;
  return start;
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

function planRows(trip: TripLike): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const when = whenText(trip);
  if (when) rows.push(["When", when]);
  if (trip.destination) rows.push(["Where", trip.destination]);
  return rows;
}

export function tripInviteEmail(opts: {
  trip: TripLike;
  travelerName: string;
  linkUrl: string;
}): { subject: string; html: string; text: string } {
  const { trip, travelerName, linkUrl } = opts;
  const heading = `${trip.hostName || "Someone"} invited you to plan ${trip.name || "a trip"}`;
  const intro = `Hi ${travelerName}, you're invited to help plan this trip. Share the dates you're free, where you'd love to go, and what you like — FinBump will match it with everyone else's answers.`;
  const rows = planRows(trip);

  const html = renderEmail({
    heading,
    intro,
    rows,
    note: trip.notes,
    linkUrl,
    linkLabel: "Share my travel preferences",
    footer: "This private link is just for you — don't forward it.",
  });

  const text = [
    heading,
    "",
    intro,
    rows.length ? `\n${rowsText(rows)}` : "",
    trip.notes ? `\nMessage from ${trip.hostName || "your host"}: ${trip.notes}` : "",
    `\nShare your preferences: ${linkUrl}`,
    "",
    "This private link is just for you — don't forward it.",
  ].join("\n");

  return { subject: `${trip.hostName || "You're invited"} — ${trip.name || "plan a trip"}`, html, text };
}

export { sendMealEmail as sendTripEmail };