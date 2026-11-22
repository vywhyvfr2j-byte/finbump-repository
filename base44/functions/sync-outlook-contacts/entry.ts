import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { importContacts, normalizeEmail } from '../../shared/importContacts.ts';

// App-user connector: FinBump Outlook Contacts
const CONNECTOR_ID = '6ad0ed8be73fb8e7e0fa7bda';
const GRAPH_CONTACTS = 'https://graph.microsoft.com/v1.0/me/contacts';
const SELECT = 'displayName,emailAddresses,homePhones,mobilePhone,businessPhones,birthday,weddingAnniversary';

// Microsoft Graph may return a date as a plain string ("1990-05-14") or as a
// DateTimeTimeZone object, and uses 0001-01-01 for "not set". Normalize to
// YYYY-MM-DD; return '' when there is no real date, because the app's date
// handling needs a full, valid date.
function dateFromGraph(v) {
  if (!v) return '';
  const raw = typeof v === 'string' ? v : (v.dateTime || '');
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const year = Number(m[1]);
  if (!year || year < 1900) return '';
  return `${m[1]}-${m[2]}-${m[3]}`;
}

async function fetchAllGraphContacts(accessToken) {
  let all = [];
  let url = `${GRAPH_CONTACTS}?$top=200&$select=${SELECT}`;
  let pages = 0;
  while (url && pages < 10) { // cap at ~2000 contacts
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, ConsistencyLevel: 'eventual' },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph API ${res.status}: ${text}`);
    }
    const data = await res.json();
    all = all.concat(data.value || []);
    url = data['@odata.nextLink'] || '';
    pages++;
  }
  return all;
}

function mapContact(c) {
  const email = c.emailAddresses && c.emailAddresses[0] ? c.emailAddresses[0].address : '';
  const phone = c.mobilePhone
    || (c.homePhones && c.homePhones[0])
    || (c.businessPhones && c.businessPhones[0])
    || '';
  return {
    name: c.displayName || '',
    email: normalizeEmail(email),
    phone: phone || '',
    birthday: dateFromGraph(c.birthday),
    anniversary: dateFromGraph(c.weddingAnniversary),
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const checkOnly = body?.checkOnly === true;

    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID));
    } catch (e) {
      return Response.json({ connected: false, reason: 'not_connected' }, { status: 402 });
    }

    // Lightweight connection check — ask for a total count only. Even if the
    // count request fails, report connected: true so the UI offers "Sync"
    // (not "Connect"); the sync itself surfaces any real API error.
    if (checkOnly) {
      try {
        const res = await fetch(`${GRAPH_CONTACTS}?$top=1&$count=true&$select=displayName`, {
          headers: { Authorization: `Bearer ${accessToken}`, ConsistencyLevel: 'eventual' },
        });
        if (!res.ok) return Response.json({ connected: true, totalItems: 0 });
        const data = await res.json();
        return Response.json({ connected: true, totalItems: data['@odata.count'] || 0 });
      } catch {
        return Response.json({ connected: true, totalItems: 0 });
      }
    }

    // Full sync — fetch from Outlook, then let the shared importer merge the
    // results into the user's People list (match by email, then by name).
    const contacts = await fetchAllGraphContacts(accessToken);
    const imports = contacts.map(mapContact).filter((c) => c.name);
    const result = await importContacts(base44, imports);
    return Response.json(result);
  } catch (error) {
    console.error('sync-outlook-contacts error', error);
    return Response.json({ error: 'Could not sync your Outlook contacts. Please try again.' }, { status: 500 });
  }
}