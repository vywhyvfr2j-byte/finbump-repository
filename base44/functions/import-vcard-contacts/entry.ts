import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { importContacts, normalizeEmail } from '../../shared/importContacts.ts';
import { checkAndRecordAttempt } from '../../shared/codeAttemptLimit.ts';

// vCard dates arrive as 1990-05-14, 19900514, or 1990-05-14T00:00:00. Returns
// YYYY-MM-DD, or '' when there is no usable FULL date — including yearless
// values like "--05-14", which the app's date handling cannot store.
function dateFromVCard(v) {
  if (!v) return '';
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) m = s.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return '';
  const year = Number(m[1]);
  if (!year || year < 1900) return '';
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// Undo vCard text escaping for the characters we care about.
function unescapeVCard(v) {
  return String(v || '')
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function firstLine(v) {
  return String(v || '').split('\n')[0];
}

// Parse a .vcf file's text into [{ name, email, phone, birthday, anniversary }].
function parseVCards(text) {
  // Unfold folded lines (a continuation starts with a space or tab).
  const unfolded = String(text || '').replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const cards = unfolded.match(/BEGIN:VCARD[\s\S]*?END:VCARD/gi) || [];
  const out = [];

  for (const card of cards) {
    const fields = {};
    for (const rawLine of card.split(/\r?\n/)) {
      const line = rawLine.trim();
      const idx = line.indexOf(':');
      if (!line || idx === -1) continue;
      // Drop any group prefix ("item1.TEL") and parameters ("TEL;CELL").
      let keyPart = line.slice(0, idx).split(';')[0];
      const dot = keyPart.lastIndexOf('.');
      if (dot > -1) keyPart = keyPart.slice(dot + 1);
      const key = keyPart.trim().toUpperCase();
      if (!key) continue;
      const value = line.slice(idx + 1);
      fields[key] = fields[key] ? `${fields[key]}\n${value}` : value;
    }

    let name = fields.FN ? unescapeVCard(firstLine(fields.FN)) : '';
    if (!name && fields.N) {
      const [last, first] = String(fields.N).split(';');
      name = [unescapeVCard(first), unescapeVCard(last)].filter(Boolean).join(' ');
    }
    name = name.replace(/\s+/g, ' ').trim();
    if (!name) continue;

    out.push({
      name,
      email: normalizeEmail(firstLine(fields.EMAIL)),
      phone: unescapeVCard(firstLine(fields.TEL)),
      birthday: dateFromVCard(fields.BDAY),
      anniversary: dateFromVCard(fields.ANNIVERSARY || fields['X-ANNIVERSARY']),
    });
  }
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // One import can create up to 1,000 contacts, so cap how often a single
    // account can run it in a day rather than letting it bulk-fill the database.
    const gate = await checkAndRecordAttempt(base44, user.id, 'vcard_import', 5, 60 * 24);
    if (!gate.allowed) {
      return Response.json(
        { error: 'You have imported contacts several times today. Please try again tomorrow.' },
        { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text : '';
    if (!text.trim()) {
      return Response.json({ error: 'No contacts file content received.' }, { status: 400 });
    }
    if (text.length > 5_000_000) {
      return Response.json({ error: 'That contacts file is too large. Please import it in smaller parts.' }, { status: 413 });
    }

    const imports = parseVCards(text).slice(0, 1000);
    if (!imports.length) {
      return Response.json({ error: 'No contacts were found in that file.' }, { status: 400 });
    }

    const result = await importContacts(base44, imports);
    return Response.json(result);
  } catch (error) {
    console.error('import-vcard-contacts error', error);
    return Response.json({ error: 'Could not import that contacts file. Please try again.' }, { status: 500 });
  }
}