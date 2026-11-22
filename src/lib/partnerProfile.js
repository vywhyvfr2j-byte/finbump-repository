// The partner's real record is the Person entity — that is what the People
// list, gifts, calendar, and reminders read. The Partner page also keeps a
// local `profile` mirror (Home and a few legacy views read it), so these
// helpers move values between the two shapes in one place and keep them in
// step whenever the partner's details are edited.

export const PARTNER_RELATIONS = ['partner', 'spouse', 'husband', 'wife'];

export function findPartnerPerson(people = []) {
  return people.find((p) => PARTNER_RELATIONS.includes((p.relation || '').toLowerCase())) || null;
}

// Person record → profile shape. The profile's own value is used only where
// the record has nothing yet (profiles created before the contact existed).
export function profileFromPerson(person, profile = {}) {
  if (!person) return profile;
  return {
    ...profile,
    name: person.name || profile.name || '',
    nickname: person.preferredName || profile.nickname || '',
    photoUrl: person.photoUrl || profile.photoUrl || '',
    phone: person.phone || profile.phone || '',
    birthday: person.birthday || profile.birthday || '',
    anniversary: person.anniversary || profile.anniversary || '',
    zipCode: person.zipCode || profile.zipCode || '',
    likes: (person.likes || []).filter(Boolean).length ? person.likes : (profile.likes || []),
    details: (person.details || []).length ? person.details : (profile.details || []),
    notes: person.notes || profile.notes || '',
  };
}

// Profile shape → the fields the partner's Person record stores.
export function personPatchFromProfile(draft = {}) {
  return {
    name: draft.name || '',
    preferredName: draft.nickname || '',
    phone: draft.phone || '',
    birthday: draft.birthday || '',
    anniversary: draft.anniversary || '',
    zipCode: draft.zipCode || '',
    likes: (draft.likes || []).filter(Boolean),
    details: draft.details || [],
    notes: draft.notes || '',
    // Omitted when empty so saving without touching the photo never clears it.
    ...(draft.photoUrl ? { photoUrl: draft.photoUrl } : {}),
  };
}