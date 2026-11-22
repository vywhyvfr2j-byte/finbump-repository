import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fileUrl = body?.file_url;
    if (!fileUrl || typeof fileUrl !== 'string') {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    const validationError = validateStorageUrl(fileUrl);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });

    // redirect: 'error' is not supported by this edge runtime (fetch throws
    // outright, so nothing ever downloads). 'manual' refuses to follow a
    // redirect instead, and we reject one explicitly below — the same
    // fail-closed intent, actually enforced.
    const resp = await fetch(fileUrl, {
      signal: AbortSignal.timeout(15000),
      redirect: 'manual',
    });
    if (resp.type === 'opaqueredirect' || (resp.status >= 300 && resp.status < 400)) {
      return Response.json({ error: 'File URL must not redirect' }, { status: 400 });
    }
    if (!resp.ok) return Response.json({ error: 'Could not download calendar file' }, { status: 502 });
    const text = await resp.text();

    const candidates = parseIcs(text);
    return Response.json({ candidates });
  } catch (error) {
    console.error('import-calendar-ics failed:', error);
    return Response.json({ error: 'Could not process calendar file' }, { status: 500 });
  }
}

// SSRF guard: only the exact storage hostnames the app's own uploads come back
// on, over https — never a suffix match on a registrable domain, which would
// wave through every subdomain under it. media.base44.com is where this app's
// private uploads are served from (CreateFileSignedUrl), static.wixstatic.com
// is the platform's public asset host. Rejects IP literals, non-https schemes,
// unknown hosts, and redirect-following.
const ALLOWED_STORAGE_HOSTS = new Set([
  'media.base44.com',
  'static.wixstatic.com',
]);

function validateStorageUrl(urlStr) {
  let url;
  try { url = new URL(urlStr); } catch { return 'Invalid file URL'; }
  if (url.protocol !== 'https:') return 'File URL must use https';
  const host = url.hostname.toLowerCase();
  if (!ALLOWED_STORAGE_HOSTS.has(host)) return 'File URL must point to FinBump storage';
  return null;
}

// Minimal ICS parser: extracts birthday/anniversary candidates only.
function parseIcs(text) {
  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  const lines = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  const events = [];
  let cur = null;
  for (const line of lines) {
    const l = line.trim();
    if (l === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (l === 'END:VEVENT') { if (cur) events.push(cur); cur = null; continue; }
    if (!cur) continue;
    const idx = l.indexOf(':');
    if (idx === -1) continue;
    const keyPart = l.slice(0, idx);
    const val = l.slice(idx + 1);
    const key = keyPart.split(';')[0].toUpperCase();
    if (key === 'SUMMARY') cur.summary = val;
    if (key === 'DTSTART') cur.dtstart = val;
    if (key === 'RRULE') cur.rrule = val;
    if (key === 'CATEGORIES') cur.categories = val;
  }
  const out = [];
  const now = new Date();
  for (const ev of events) {
    if (!ev.summary || !ev.dtstart) continue;
    const lower = (ev.summary + ' ' + (ev.categories || '')).toLowerCase();
    const isYearly = (ev.rrule || '').toUpperCase().includes('FREQ=YEARLY');
    let type = null;
    if (lower.includes('birthday') || lower.includes('bday')) type = 'birthday';
    else if (lower.includes('anniversary')) type = 'anniversary';
    else if (isYearly) type = 'birthday'; // recurring annual event -> treat as a birthday by default
    if (!type) continue;
    const md = parseDate(ev.dtstart);
    if (!md) continue;
    const next = nextOccurrence(md.month, md.day, now);
    out.push({
      summary: ev.summary.trim(),
      type,
      month: md.month,
      day: md.day,
      nextDate: next.toISOString(),
    });
  }
  return out;
}

function parseDate(val) {
  const m = val.match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function nextOccurrence(month, day, now) {
  const year = now.getFullYear();
  let d = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (d < now) d = new Date(year + 1, month - 1, day, 12, 0, 0, 0);
  return d;
}