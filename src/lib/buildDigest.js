import { daysUntil, actStatus, formatDate } from '@/lib/keepsakeUtils';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Compiles an HTML digest email body from current highlights and upcoming dates.
export function buildDigest({ acts, events, giftIdeas, cadence }) {
  const overdueActs = acts.filter((a) => actStatus(a) === 'overdue');
  const upcomingEvents = events
    .filter((e) => daysUntil(e.date) >= 0 && daysUntil(e.date) <= 30)
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const openGiftIdeas = giftIdeas.filter((g) => !g.purchased).slice(0, 5);

  const actItems = overdueActs.length
    ? overdueActs.map((a) => `<li>${a.emoji || ''} ${escapeHtml(a.name)}</li>`).join('')
    : '<li>You\'re all caught up!</li>';
  const eventItems = upcomingEvents.length
    ? upcomingEvents.map((e) => `<li><strong>${escapeHtml(e.name)}</strong> — ${formatDate(e.date)}, in ${daysUntil(e.date)} days</li>`).join('')
    : '<li>Nothing in the next 30 days.</li>';
  const giftItems = openGiftIdeas.length
    ? openGiftIdeas.map((g) => `<li>${escapeHtml(g.title)}</li>`).join('')
    : '<li>No open gift ideas saved.</li>';

  const body = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; max-width: 560px;">
  <p style="font-size: 16px; margin: 0 0 16px;">Here's your ${cadence} FinBump digest:</p>

  <p style="font-size: 15px; font-weight: 600; margin: 0 0 8px;">Acts that need attention:</p>
  <ul style="margin: 0 0 16px; padding-left: 20px; font-size: 14px; line-height: 1.6;">
    ${actItems}
  </ul>

  <p style="font-size: 15px; font-weight: 600; margin: 0 0 8px;">Upcoming dates:</p>
  <ul style="margin: 0 0 16px; padding-left: 20px; font-size: 14px; line-height: 1.6;">
    ${eventItems}
  </ul>

  <p style="font-size: 15px; font-weight: 600; margin: 0 0 8px;">Gift ideas to consider:</p>
  <ul style="margin: 0 0 16px; padding-left: 20px; font-size: 14px; line-height: 1.6;">
    ${giftItems}
  </ul>
</div>`;

  const subject = `Your ${cadence} FinBump digest`;
  return { subject, body };
}