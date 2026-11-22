// Shared contact-import logic used by every contact source (Google Contacts,
// Outlook Contacts, and .vcf file import). Incoming contacts are matched
// against the user's existing Person records by email first, then by name, so
// repeat imports never create duplicates — and missing details are only ever
// FILLED IN, never overwriting what the user already typed.

export function normalizeEmail(e) {
  if (!e) return '';
  return String(e).trim().toLowerCase();
}

export function normName(n) {
  return String(n || '').trim().toLowerCase();
}

// Bulk-entity calls cap at 500 records each; chunk well under that so a large
// address book can never silently drop contacts.
async function chunkedWrite(records, method) {
  const SIZE = 200;
  for (let i = 0; i < records.length; i += SIZE) {
    await method(records.slice(i, i + SIZE));
  }
}

// imports: [{ name, email, phone, birthday, anniversary }]
// Returns { imported, created, updated }.
export async function importContacts(base44, imports) {
  const clean = (imports || []).filter((c) => c && c.name && String(c.name).trim());

  const existing = await base44.entities.Person.filter({});
  const byEmail = {};
  const byName = {};
  for (const p of existing) {
    if (p.email) byEmail[normalizeEmail(p.email)] = p;
    const nm = normName(p.name);
    if (nm) byName[nm] = p;
  }

  const toCreate = [];
  const toUpdate = [];
  for (const imp of clean) {
    const email = normalizeEmail(imp.email);
    // Match by email first, then by name — many contacts have no email, so
    // name matching prevents duplicates on repeat imports.
    const match = email ? byEmail[email] : null;
    const nameMatch = !match && imp.name ? byName[normName(imp.name)] : null;
    const existingRec = match || nameMatch;

    if (existingRec) {
      const patch = {};
      if (!existingRec.email && email) patch.email = email;
      if (!existingRec.birthday && imp.birthday) patch.birthday = imp.birthday;
      if (!existingRec.anniversary && imp.anniversary) patch.anniversary = imp.anniversary;
      if (!existingRec.phone && imp.phone) patch.phone = imp.phone;
      if (Object.keys(patch).length) toUpdate.push({ id: existingRec.id, ...patch });
    } else {
      toCreate.push({
        name: String(imp.name).trim(),
        email,
        phone: imp.phone || '',
        birthday: imp.birthday || '',
        anniversary: imp.anniversary || '',
        relation: 'other',
      });
    }
  }

  if (toCreate.length) await chunkedWrite(toCreate, (batch) => base44.entities.Person.bulkCreate(batch));
  if (toUpdate.length) await chunkedWrite(toUpdate, (batch) => base44.entities.Person.bulkUpdate(batch));

  return { imported: clean.length, created: toCreate.length, updated: toUpdate.length };
}