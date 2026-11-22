import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X, Heart } from 'lucide-react';
import { DEFAULT_REMEMBRANCE_LEAD_DAYS } from '@/lib/remembrance';
import { RELATIONS } from '@/lib/peopleConstants';
import PersonRelationships from './PersonRelationships';
import PersonPets from './PersonPets';
import OtherItemsList from './OtherItemsList';
import PersonGiftsInline from './PersonGiftsInline';
import PersonBudgetInline from './PersonBudgetInline';
import ScheduleAdder from './ScheduleAdder';
import ScheduleList from './ScheduleList';

const DETAIL_CATEGORIES = ['Favorite Coffee', 'Favorite Drink', 'Favorite Snack', 'Challenges', 'Allergies', 'Dietary Restrictions', 'Clothing Size', 'Shoe Size', 'Hobbies', 'Favorite Color', 'Favorite Flower', 'Music Preference', 'Love Language', 'Other'];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

const AREAS = [
  { value: 'personal', label: 'Profile items' },
  { value: 'family', label: 'Family / Pets' },
  { value: 'gifts', label: 'Gift Ideas' },
  { value: 'budget', label: 'Budget' },
  { value: 'care', label: 'Prayer / Medical / Other' },
];

// Dropdown of main areas for a contact. Personal Details, Family/Pets, and
// Care reminders render inline; Gift Ideas and Budget navigate to the
// existing gift tracker (gift list / budget section respectively).
export default function PersonAreaDropdown({ person, people, editing, draft, setDraft, save, onUpdate, onSelectPerson }) {
  const navigate = useNavigate();
  const [area, setArea] = useState('personal');
  const [newDetailCategory, setNewDetailCategory] = useState('Favorite Color');
  const [newDetailCustomLabel, setNewDetailCustomLabel] = useState('');
  const [newDetailValue, setNewDetailValue] = useState('');
  const [newLike, setNewLike] = useState('');
  const [newNote, setNewNote] = useState('');

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const handleSelect = (value) => {
    if (value === 'care') {
      navigate('/prayer');
      return;
    }
    setArea(value);
  };

  // Things They Love + Notes + Details commit immediately via onUpdate.
  const addLike = () => {
    const v = newLike.trim();
    if (!v) return;
    onUpdate({ likes: [...(person.likes || []), v] });
    setNewLike('');
  };
  const removeLike = (i) => onUpdate({ likes: (person.likes || []).filter((_, idx) => idx !== i) });

  const noteItems = (person.notes || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const addNote = () => {
    const v = newNote.trim();
    if (!v) return;
    onUpdate({ notes: [...noteItems, v].join('\n') });
    setNewNote('');
  };
  const removeNote = (i) => onUpdate({ notes: noteItems.filter((_, idx) => idx !== i).join('\n') });

  const addDetail = () => {
    if (!newDetailValue.trim()) return;
    const label = newDetailCategory === 'Other' ? newDetailCustomLabel.trim() || 'Other' : newDetailCategory;
    const detail = { id: 'd' + Date.now(), label, value: newDetailValue.trim() };
    onUpdate({ details: [...(person.details || []), detail] });
    setNewDetailValue('');
    setNewDetailCustomLabel('');
  };
  const deleteDetail = (id) => onUpdate({ details: (person.details || []).filter((x) => x.id !== id) });

  return (
    <div className="space-y-4">
      <Select value={area} onValueChange={handleSelect}>
        <SelectTrigger className="h-11" aria-label="Profile area">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AREAS.map((a) => (
            <SelectItem key={a.value} value={a.value}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {area === 'personal' && (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Personal Details</p>
          <Field label="Their name">
            <Input value={person.name} disabled className="h-11" />
          </Field>
          <Field label="Nickname or preferred name">
            <Input
              value={editing ? draft.preferredName || '' : person.preferredName || ''}
              onChange={set('preferredName')}
              disabled={!editing}
              className="h-11"
              placeholder="What do you call them?"
            />
          </Field>
          <Field label="Phone number">
            <Input
              type="tel"
              value={editing ? draft.phone || '' : person.phone || ''}
              onChange={set('phone')}
              disabled={!editing}
              className="h-11"
              placeholder="e.g. +1 555 123 4567"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={editing ? draft.email || '' : person.email || ''}
              onChange={set('email')}
              disabled={!editing}
              className="h-11"
              placeholder="e.g. alex@example.com"
            />
          </Field>

          {editing && (
            <Field label="Relationship">
              <Select value={draft.relation} onValueChange={(v) => setDraft((d) => ({ ...d, relation: v }))}>
                <SelectTrigger className="h-11" aria-label="Relationship">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONS.filter((r) => r.key !== 'partner').map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.emoji} {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Birthday">
              <Input type="date" value={editing ? draft.birthday || '' : person.birthday || ''} onChange={set('birthday')} disabled={!editing} className="h-11" />
            </Field>
            <Field label="Anniversary">
              <Input type="date" value={editing ? draft.anniversary || '' : person.anniversary || ''} onChange={set('anniversary')} disabled={!editing} className="h-11" />
            </Field>
          </div>

          {/* Remembering — one annual date instead of birthdays, anniversaries
              and check-in cadences, for someone who has passed or is no longer
              in the user's life. */}
          <div className="rounded-2xl border border-border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Heart size={14} /> Remembering them
              </span>
              <Switch
                checked={!!(editing ? draft.remembering : person.remembering)}
                disabled={!editing}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, remembering: v }))}
                aria-label="Remembering them"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Keeps their photos, notes and memories. Reminds you on their date instead of birthdays and check-ins.
            </p>
            {(editing ? draft.remembering : person.remembering) && (
              <>
                <Field label="Date to remember">
                  <Input
                    type="date"
                    value={editing ? draft.remembranceDate || '' : person.remembranceDate || ''}
                    onChange={set('remembranceDate')}
                    disabled={!editing}
                    className="h-11"
                  />
                </Field>
                <Field label="Remind me (days before)">
                  <Input
                    type="number"
                    min="0"
                    value={editing ? (draft.remembranceLeadDays ?? DEFAULT_REMEMBRANCE_LEAD_DAYS) : (person.remembranceLeadDays ?? DEFAULT_REMEMBRANCE_LEAD_DAYS)}
                    onChange={(e) => setDraft((d) => ({ ...d, remembranceLeadDays: Number(e.target.value) }))}
                    disabled={!editing}
                    className="h-11"
                  />
                </Field>
                <Field label="What you'd like to do">
                  <Input
                    value={editing ? draft.remembranceNote || '' : person.remembranceNote || ''}
                    onChange={set('remembranceNote')}
                    placeholder="Light a candle, visit the garden…"
                    disabled={!editing}
                    className="h-11"
                  />
                </Field>
              </>
            )}
          </div>

          <Field label="Home zip code">
            <Input
              value={editing ? draft.zipCode || '' : person.zipCode || ''}
              onChange={set('zipCode')}
              disabled={!editing}
              className="h-11"
              placeholder="e.g. 60601"
            />
          </Field>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Things They Love</label>
            {(person.likes || []).filter(Boolean).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(person.likes || []).filter(Boolean).map((like, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-secondary rounded-full pl-3 pr-1.5 py-1 text-sm">
                    {like}
                    <button onClick={() => removeLike(i)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${like}`}>
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Input
                value={newLike}
                onChange={(e) => setNewLike(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLike(); } }}
                placeholder="Something they love"
                aria-label="Something they love"
                className="h-9 text-sm flex-1"
              />
              <Button onClick={addLike} disabled={!newLike.trim()} size="sm" className="h-9 px-3">
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Additional info</label>
            {(person.details || []).length > 0 && (
              <div className="space-y-1.5">
                {(person.details || []).map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-secondary/60 rounded-xl px-3 py-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">{d.label}: </span>
                      <span className="font-medium">{d.value}</span>
                    </div>
                    <button onClick={() => deleteDetail(d.id)} aria-label="Remove detail" className="text-muted-foreground shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-card rounded-2xl border border-border p-3 space-y-2">
              <Select value={newDetailCategory} onValueChange={setNewDetailCategory}>
                <SelectTrigger className="h-10" aria-label="Detail category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DETAIL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newDetailCategory === 'Other' && (
                <Input
                  value={newDetailCustomLabel}
                  onChange={(e) => setNewDetailCustomLabel(e.target.value)}
                  placeholder="Label (e.g. Coffee order)"
                  aria-label="Custom detail label"
                  className="h-10"
                />
              )}
              <Input
                value={newDetailValue}
                onChange={(e) => setNewDetailValue(e.target.value)}
                placeholder="Details"
                aria-label="Detail value"
                className="h-10"
              />
              <Button onClick={addDetail} disabled={!newDetailValue.trim()} className="w-full h-9">
                Add
              </Button>
            </div>
          </div>

          <OtherItemsList items={person.otherItems || []} onUpdate={(items) => onUpdate({ otherItems: items })} />

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            {noteItems.length > 0 && (
              <ul className="space-y-1.5">
                {noteItems.map((n, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 bg-secondary/60 rounded-xl px-3 py-2">
                    <span className="text-sm leading-relaxed">{n}</span>
                    <button onClick={() => removeNote(i)} className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5" aria-label="Remove note">
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-1.5">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNote(); } }}
                placeholder="Add a note"
                aria-label="Add a note"
                className="h-9 text-sm flex-1"
              />
              <Button onClick={addNote} disabled={!newNote.trim()} size="sm" className="h-9 px-3">
                Add
              </Button>
            </div>
          </div>

          {editing && (
            <Button onClick={save} className="w-full h-12 rounded-2xl">
              Save profile
            </Button>
          )}

          <ScheduleAdder personName={person.name} personId={person.id} />
          <ScheduleList personName={person.name} personId={person.id} />
        </div>
      )}

      {area === 'family' && (
        <div className="space-y-4">
          <PersonRelationships person={person} people={people} onUpdate={onUpdate} onSelectPerson={onSelectPerson} />
          <PersonPets person={person} />
        </div>
      )}

      {area === 'gifts' && <PersonGiftsInline person={person} />}

      {area === 'budget' && <PersonBudgetInline person={person} />}
    </div>
  );
}