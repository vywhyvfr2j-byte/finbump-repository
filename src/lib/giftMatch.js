// Single source of truth for "which person does this gift belong to?".
// The tracker refuses to guess when a name is shared by more than one person,
// so the gift never appears in either person's list. The home budget total and
// budget alerts use the SAME rule here, so the totals always reconcile across
// every gift area.
export const buildNameCount = (people) =>
  (people || []).reduce((acc, p) => {
    acc[p.name] = (acc[p.name] || 0) + 1;
    return acc;
  }, {});

export const giftMatchesPerson = (g, person, nameCounts) => {
  if (!person) return false;
  if (g.personId) return String(g.personId) === String(person.id);
  const pn = (typeof g.person === 'string' ? g.person : '').trim();
  return pn !== '' && pn === person.name && nameCounts[person.name] === 1;
};