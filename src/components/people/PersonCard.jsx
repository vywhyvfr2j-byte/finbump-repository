import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/keepsakeUtils';
import { RELATIONS, DATE_TYPES, nextOccurrence } from '@/lib/peopleConstants';
import { Trash2, Gift, Pencil, CalendarPlus, X } from 'lucide-react';
import PersonEditForm from './PersonEditForm';
import AddPersonEventForm from './AddPersonEventForm';
import PersonEventItem from './PersonEventItem';
import PersonPreferences from './PersonPreferences';
import { Image } from '@/components/ui/image';
import RelationshipHealthScore from './RelationshipHealthScore';

export default function PersonCard({ person, giftCount, onDelete, onUpdate, onAddEvent, onUpdateEvent, onDeleteEvent, personEvents = [] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person);
  const [addingEvent, setAddingEvent] = useState(false);
  const [budget, setBudget] = useState(person.giftBudget || '');
  useEffect(() => setBudget(person.giftBudget || ''), [person.giftBudget]);

  const info = RELATIONS.find((r) => r.key === person.relation) || RELATIONS[4];
  const birthdayInfo = DATE_TYPES.find((t) => t.key === 'birthday');
  const anniversaryInfo = DATE_TYPES.find((t) => t.key === 'anniversary');

  const startEdit = () => {
    setDraft(person);
    setEditing(true);
  };
  const save = () => {
    onUpdate(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4">
        <PersonEditForm draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {person.photoUrl ? (
            <Image
              src={person.photoUrl}
              alt={person.name}
              fittingType="fill"
              className="w-9 h-9 rounded-full shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0">
              {info.emoji}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{person.preferredName || person.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{info.label}</p>
          </div>
          <RelationshipHealthScore personId={person.id} personName={person.name} size={32} />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button onClick={startEdit} className="text-muted-foreground">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(person.id)} className="text-muted-foreground">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {person.birthday && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
          <span>{birthdayInfo.emoji}</span> {birthdayInfo.label}: {formatDate(nextOccurrence(person.birthday))}
        </p>
      )}
      {person.anniversary && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
          <span>{anniversaryInfo.emoji}</span> {anniversaryInfo.label}: {formatDate(nextOccurrence(person.anniversary))}
        </p>
      )}
      {person.notes && <p className="text-xs text-muted-foreground mt-1.5">{person.notes}</p>}
      <PersonPreferences person={person} onUpdate={onUpdate} />
      {personEvents.map((ev) => (
        <PersonEventItem key={ev.id} event={ev} onUpdate={onUpdateEvent} onDelete={onDeleteEvent} />
      ))}
      <Link
        to={`/gift-tracker?person=${encodeURIComponent(person.name)}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mt-2.5"
      >
        <Gift size={13} /> {giftCount > 0 ? `${giftCount} gift idea${giftCount === 1 ? '' : 's'}` : 'Add a gift idea'}
      </Link>

      <div className="flex items-center gap-2 mt-2">
        <Gift size={13} className="text-primary shrink-0" />
        <span className="text-xs text-muted-foreground shrink-0">Gift budget</span>
        <Input
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          onBlur={() => {
            if ((person.giftBudget || '') !== budget) onUpdate({ ...person, giftBudget: budget });
          }}
          placeholder="$100"
          className="h-8 text-xs flex-1"
          aria-label="Gift budget"
        />
      </div>

      <button
        onClick={() => setAddingEvent((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary mt-2.5"
      >
        {addingEvent ? <X size={13} /> : <CalendarPlus size={13} />} {addingEvent ? 'Cancel' : 'Add one-time event'}
      </button>
      {addingEvent && <AddPersonEventForm onAdd={onAddEvent} onClose={() => setAddingEvent(false)} />}
    </div>
  );
}