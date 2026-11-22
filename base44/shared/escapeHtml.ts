// HTML-escapes user-controlled text before it is interpolated into a SendEmail
// `body` (which the integration treats as HTML). Prevents HTML content
// spoofing — misleading links, tracking images, formatting — in admin emails.
export function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}