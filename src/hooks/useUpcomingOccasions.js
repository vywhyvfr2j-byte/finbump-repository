import { useMemo } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { daysUntil } from '@/lib/keepsakeUtils';
import { nextOccurrence } from '@/lib/peopleConstants';

// Years between a stored date (YYYY-MM-DD) and the occurrence it rolls forward
// to — the age someone is turning, or the number of years together.
function yearsAt(dateStr, occurrence) {
  const year = Number(String(dateStr).split('-')[0]);
  const years = occurrence.getFullYear() - year;
  return Number.isInteger(years) && years >= 0 ? years : null;
}

// Every upcoming birthday, anniversary and pet Gotcha Day — the data behind the
// Month Ahead dashboard. Each entry carries its next date, the countdown in
// days, and the age / years together, soonest first.
//
// Partner entries are skipped when the partner also exists in people[] so nobody
// is listed twice, and a contact is listed before a pet that falls on the same
// day. Entries are also de-duplicated by name + occasion, so a duplicated
// connection record can't show the same birthday twice.
export function useUpcomingOccasions() {
  const { profile, people, pets } = useKeepsake();

  return useMemo(() => {
    const entries = [];
    const push = (entity, kind, dateStr) => {
      if (!dateStr) return;
      const iso = nextOccurrence(dateStr);
      if (!iso) return;
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return;
      entries.push({
        key: `${entity.id || 'partner'}-${kind}`,
        name: entity.preferredName || entity.name,
        personId: entity.id || 'partner',
        relation: entity.relation || '',
        // Owner of a pet, so the gift areas can be scoped to them the same way
        // the pet profile links into the Gift tracker.
        ownerId: entity.ownerId || '',
        species: entity.species || '',
        notes: entity.notes || '',
        likes: Array.isArray(entity.likes) ? entity.likes : [],
        occasion: kind === 'birthday' ? 'birthday' : kind === 'adoption' ? 'gotcha' : 'anniversary',
        date,
        days: daysUntil(iso),
        years: yearsAt(dateStr, date),
      });
    };

    const partnerPerson = (people || []).find((p) =>
      ['partner', 'spouse'].includes((p.relation || '').toLowerCase())
    );
    const partnerName = profile?.name?.trim() || partnerPerson?.name;
    const partnerBirthday = profile?.birthday || partnerPerson?.birthday;
    const partnerAnniversary = profile?.anniversary || partnerPerson?.anniversary;
    if (partnerName || partnerBirthday || partnerAnniversary) {
      const partner = {
        id: 'partner',
        name: partnerName || 'Partner',
        preferredName: partnerPerson?.preferredName,
        relation: 'partner',
        notes: profile?.notes || '',
        likes: Array.isArray(profile?.likes) ? profile.likes : [],
      };
      push(partner, 'birthday', partnerBirthday);
      push(partner, 'anniversary', partnerAnniversary);
    }

    (people || []).forEach((p) => {
      if (partnerPerson && p.id === partnerPerson.id) return;
      if (partnerName && p.name === partnerName) return;
      // Remembrance dates are shown separately and never offer cards or gifts.
      if (p.remembering) return;
      push(p, 'birthday', p.birthday);
      push(p, 'anniversary', p.anniversary);
    });

    (pets || []).forEach((pet) => {
      if (pet.remembering) return;
      const petCtx = { ...pet, relation: 'pet' };
      push(petCtx, 'birthday', pet.birthday);
      push(petCtx, 'adoption', pet.adoptionDate);
    });

    const seen = new Set();
    return entries
      .sort(
        (a, b) =>
          a.date - b.date || (a.relation === 'pet' ? 1 : 0) - (b.relation === 'pet' ? 1 : 0)
      )
      .filter((e) => {
        const key = `${e.name}|${e.occasion}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [profile, people, pets]);
}