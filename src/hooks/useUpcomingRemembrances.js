import { useMemo } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { nextRemembrance, remembranceYears } from '@/lib/remembrance';

// Every contact (person or pet) the user is remembering, with their next annual
// remembrance date, how many days away it is, and the note they wrote for the
// day. Soonest first — the quiet counterpart to useUpcomingOccasions.
export function useUpcomingRemembrances() {
  const { people, pets } = useKeepsake();

  return useMemo(() => {
    const entries = [];
    const push = (entity, kind) => {
      if (!entity.remembering || !entity.remembranceDate) return;
      const next = nextRemembrance(entity.remembranceDate);
      if (!next) return;
      entries.push({
        key: `${entity.id}-remembrance`,
        id: entity.id,
        kind,
        name: entity.preferredName || entity.name,
        relation: entity.relation || (kind === 'pet' ? 'pet' : ''),
        photoUrl: entity.photoUrl || '',
        note: entity.remembranceNote || '',
        date: next.date,
        days: next.days,
        years: remembranceYears(entity.remembranceDate, next.date),
      });
    };

    (people || []).forEach((p) => push(p, 'person'));
    (pets || []).forEach((p) => push(p, 'pet'));

    const seen = new Set();
    return entries
      .sort((a, b) => a.date - b.date || a.name.localeCompare(b.name))
      .filter((e) => {
        const key = `${e.name}|${e.id}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [people, pets]);
}