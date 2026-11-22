import React, { useMemo, useState } from 'react';
import TopNav from '@/components/TopNav';
import { useKeepsake } from '@/lib/keepsakeStore';
import { nextRemembrance, remembranceYears, remembranceLeadDays } from '@/lib/remembrance';
import RemembranceForm from '@/components/remembering/RemembranceForm';
import RememberedList from '@/components/remembering/RememberedList';

// A quiet home for the dates the user keeps for people and pets who have passed
// away or left their life. Each date rolls forward every year and nudges a few
// days early through the notification feed.
export default function Remembering() {
  const { people = [], pets = [], updatePerson, updatePet } = useKeepsake();
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState('');

  const contacts = useMemo(() => [
    ...people.map((p) => ({
      kind: 'person',
      id: p.id,
      name: p.preferredName || p.name || 'Someone you love',
      sub: p.relation || 'Person',
      date: p.remembranceDate || '',
      note: p.remembranceNote || '',
      leadDays: p.remembranceLeadDays,
      photos: p.remembrancePhotos || [],
      remembering: !!p.remembering,
    })),
    ...pets.map((p) => ({
      kind: 'pet',
      id: p.id,
      name: p.name || 'Your pet',
      sub: p.species || 'Pet',
      date: p.remembranceDate || '',
      note: p.remembranceNote || '',
      leadDays: p.remembranceLeadDays,
      photos: p.remembrancePhotos || [],
      remembering: !!p.remembering,
    })),
  ], [people, pets]);

  const rows = useMemo(() => contacts
    .filter((c) => c.remembering)
    .map((c) => {
      const next = c.date ? nextRemembrance(c.date) : null;
      return {
        ...c,
        next: next ? next.date : null,
        days: next ? next.days : null,
        years: next ? remembranceYears(c.date, next.date) : null,
        lead: remembranceLeadDays({ remembranceLeadDays: c.leadDays }),
      };
    })
    .sort((a, b) => (a.next ? a.next.getTime() : Infinity) - (b.next ? b.next.getTime() : Infinity) || a.name.localeCompare(b.name)), [contacts]);

  const save = (entry) => {
    const patch = {
      remembering: true,
      remembranceDate: entry.date,
      remembranceNote: entry.note,
      remembranceLeadDays: entry.leadDays,
      remembrancePhotos: entry.photos || [],
    };
    if (entry.kind === 'pet') updatePet(entry.id, patch);
    else updatePerson(entry.id, patch);
    setEditing(null);
    setSaved(`${entry.name} is in your remembrance dates.`);
  };

  const stop = (row) => {
    if (row.kind === 'pet') updatePet(row.id, { remembering: false });
    else updatePerson(row.id, { remembering: false });
    if (editing && editing.id === row.id) setEditing(null);
    setSaved(`${row.name} is no longer on your remembrance dates. Their photos and notes stay.`);
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title="Remembrance" subtitle="The dates you keep" back backTo="/find-it" />
      <div className="px-5 mt-2 space-y-5">
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-sm text-foreground">
            Keep a yearly date for a friend, family member, or pet who has passed away or is no longer in your life.
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            A gentle reminder arrives a few days before each date. Birthdays, gifts, and check-ins stay paused for them.
          </p>
        </div>

        {saved && (
          <p className="text-xs text-primary px-1" role="status">{saved}</p>
        )}

        <RememberedList
          rows={rows}
          onEdit={(row) => { setSaved(''); setEditing(row); }}
          onStop={stop}
        />

        <RemembranceForm
          key={editing ? `${editing.kind}-${editing.id}` : 'new'}
          contacts={contacts}
          seed={editing}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : null}
        />
      </div>
    </div>
  );
}