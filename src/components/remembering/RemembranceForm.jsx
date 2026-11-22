import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RemembranceIcon from '@/components/icons/RemembranceIcon';
import MemoryPhotoPicker from '@/components/memory/MemoryPhotoPicker';
import ResponsiveSelect from '@/components/ui/responsive-select';

const LEAD_CHOICES = [0, 1, 2, 3, 5, 7, 14];

const selectClass = 'h-11 rounded-xl bg-card text-sm';

// Pick a contact, give the yearly date, and choose how many days early the
// reminder should arrive. Saving marks that person or pet as remembered, which
// pauses their birthdays, gifts, and check-ins without losing anything.
export default function RemembranceForm({ contacts = [], seed = null, onSave, onCancel }) {
  const people = contacts.filter((c) => c.kind === 'person');
  const pets = contacts.filter((c) => c.kind === 'pet');
  const [picked, setPicked] = useState(seed ? `${seed.kind}:${seed.id}` : '');
  const [date, setDate] = useState(seed?.date || '');
  const [note, setNote] = useState(seed?.note || '');
  const [lead, setLead] = useState(String(seed?.leadDays ?? 3));
  const [photos, setPhotos] = useState(seed?.photos || []);
  const [hint, setHint] = useState('');

  const choose = (value) => {
    setPicked(value);
    setHint('');
    const contact = contacts.find((c) => `${c.kind}:${c.id}` === value);
    if (!contact) return;
    setDate(contact.date || '');
    setNote(contact.note || '');
    setPhotos(contact.photos || []);
    setLead(String(Number.isFinite(Number(contact.leadDays)) ? Number(contact.leadDays) : 3));
  };

  const submit = (e) => {
    e.preventDefault();
    const [kind, id] = picked.split(':');
    if (!id) { setHint('Choose who this date is for.'); return; }
    if (!date) { setHint('Add the date you keep for them.'); return; }
    const contact = contacts.find((c) => c.kind === kind && c.id === id);
    onSave({ kind, id, name: contact?.name || 'They', date, note: note.trim(), leadDays: Number(lead), photos });
  };

  const heading = seed ? `Editing ${seed.name}'s date` : 'Add a date to remember';

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <RemembranceIcon size={13} /> {heading}
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">Who is this date for?</Label>
        <ResponsiveSelect
          value={picked}
          onValueChange={choose}
          placeholder="Choose a person or pet"
          ariaLabel="Who is this date for?"
          title="Who is this date for?"
          className={selectClass}
          groups={[
            {
              label: 'Friends & family',
              options: people.map((c) => ({
                value: `person:${c.id}`,
                label: c.sub ? `${c.name} · ${c.sub}` : c.name,
              })),
            },
            {
              label: 'Pets',
              options: pets.map((c) => ({
                value: `pet:${c.id}`,
                label: c.sub ? `${c.name} · ${c.sub}` : c.name,
              })),
            },
          ]}
        />
        {contacts.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            Add a person or pet first, then come back to keep their date.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remembrance-date" className="text-xs">The date you keep</Label>
        <Input
          id="remembrance-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-xl"
        />
        <p className="text-[11px] text-muted-foreground">
          This date returns every year — the day they passed, or the day you last had them in your life.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Remind me before</Label>
        <ResponsiveSelect
          value={lead}
          onValueChange={setLead}
          ariaLabel="Remind me before"
          title="Remind me before"
          className={selectClass}
          options={LEAD_CHOICES.map((n) => ({
            value: String(n),
            label: n === 0 ? 'On the day' : `${n} day${n === 1 ? '' : 's'} before`,
          }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remembrance-note" className="text-xs">What you would like to do (optional)</Label>
        <Input
          id="remembrance-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Light a candle, visit the garden…"
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Photos to keep with this date (optional)</Label>
        <MemoryPhotoPicker photos={photos} onChange={setPhotos} />
        <p className="text-[11px] text-muted-foreground">
          Only you can see these. They are kept privately with this date.
        </p>
      </div>

      {hint && <p className="text-xs text-destructive">{hint}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" className="flex-1 h-11 rounded-xl">Save date</Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="h-11 rounded-xl">Cancel</Button>
        )}
      </div>
    </form>
  );
}