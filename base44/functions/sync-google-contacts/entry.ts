import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { importContacts, normalizeEmail } from '../../shared/importContacts.ts';

// App-user connector: FinBump Google Contacts
const CONNECTOR_ID = '6aa9a817babcba65012bc9b7';
const PEOPLE_API = 'https://people.googleapis.com/v1/people/connections';
const PERSON_FIELDS = 'names,emailAddresses,phoneNumbers,birthdays,events';

// Google Date -> YYYY-MM-DD. Returns '' when the year is missing, because
// the app's date handling needs a full date and a yearless value would break it.
function dateFromGoogleDate(d) {
  if (!d || !d.year || !d.month || !d.day) return '';
  const m = String(d.month).padStart(2, '0');
  const day = String(d.day).padStart(2, '0');
  return `${d.year}-${m}-${day}`;
}

async function fetchAllGoogleContacts(accessToken) {
  let all = [];
  let pageToken = '';
  let pages = 0;
  do {
    const url = new URL(PEOPLE_API);
    url.searchParams.set('personFields', PERSON_FIELDS);
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google API ${res.status}: ${text}`);
    }
    const data = await res.json();
    all = all.concat(data.connections || []);
    pageToken = data.nextPageToken || '';
    pages++;
  } while (pageToken && pages < 10); // cap at ~1000 contacts
  return all;
}

function mapContact(c) {
  const nameObj = (c.names && c.names[0]) || {};
  const name = nameObj.displayName || nameObj.unstructuredName || '';
  const email = c.emailAddresses && c.emailAddresses[0] ? c.emailAddresses[0].value : '';
  const phone = c.phoneNumbers && c.phoneNumbers[0] ? c.phoneNumbers[0].value : '';
  const birthday = c.birthdays && c.birthdays[0] ? dateFromGoogleDate(c.birthdays[0].date) : '';
  let anniversary = '';
  if (Array.isArray(c.events)) {
    const ann = c.events.find((e) => (e.type || '').toLowerCase() === 'anniversary');
    if (ann && ann.date) anniversary = dateFromGoogleDate(ann.date);
  }
  return { name, email: normalizeEmail(email), phone, birthday, anniversary };
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

    // Lightweight connection check — fetch one contact + the total count.
    // Even if the Google API hiccups, we still report connected: true so the
    // frontend shows "Sync" (not "Connect") — the sync itself will surface
    // any real API error.
    if (checkOnly) {
      try {
        const url = new URL(PEOPLE_API);
        url.searchParams.set('personFields', PERSON_FIELDS);
        url.searchParams.set('pageSize', '1');
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          return Response.json({ connected: true, totalItems: 0 });
        }
        const data = await res.json();
        return Response.json({ connected: true, totalItems: data.totalItems || 0 });
      } catch {
        return Response.json({ connected: true, totalItems: 0 });
      }
    }

    // Full sync — fetch from Google, then let the shared importer merge the
    // results into the user's People list (match by email, then by name).
    const googleContacts = await fetchAllGoogleContacts(accessToken);
    const imports = googleContacts.map(mapContact).filter((c) => c.name);
    const result = await importContacts(base44, imports);
    return Response.json(result);
  } catch (error) {
    console.error('sync-google-contacts error', error);
    return Response.json({ error: 'Could not sync your Google contacts. Please try again.' }, { status: 500 });
  }
}