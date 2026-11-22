import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pencil, Check, Camera, Loader2, X, Trash2, Sparkles, Gift, UserCircle2, Plus, ExternalLink, Heart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_REMEMBRANCE_LEAD_DAYS } from '@/lib/remembrance';
import { isSafeUrl } from '@/lib/giftPurchase';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/keepsakeUtils';
import { nextOccurrence, buildOwnerOptions, ownerDisplayName, SELF_OWNER_ID } from '@/lib/peopleConstants';
import { useKeepsake } from '@/lib/keepsakeStore';
import PersonCareReminders from '@/components/people/PersonCareReminders';
import PhotoGallery from '@/components/shared/PhotoGallery';
import ResponsiveSelect from '@/components/ui/responsive-select';

const DETAIL_CATEGORIES = ['Vet / Clinic', 'Medications', 'Allergies', 'Diet', 'Favorite Toy', 'Microchip ID', 'Insurance', 'Other'];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

// Full profile editor + related-entries view for a pet. Mirrors the Person
// profile panel but uses adoption date instead of anniversary, and species/breed
// instead of relationship. No partner sync — pets are user-only.
export default function PetProfilePanel({ pet, onUpdate, onDelete }) {
  const { giftIdeas, addGiftIdea, updateGiftIdea, deleteGiftIdea, cycleGiftStatus, personBudgets, addEvent, events, people, myName } = useKeepsake();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pet);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [newDetailCategory, setNewDetailCategory] = useState('Favorite Toy');
  const [newDetailCustomLabel, setNewDetailCustomLabel] = useState('');
  const [newDetailValue, setNewDetailValue] = useState('');
  const [newLike, setNewLike] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newGiftTitle, setNewGiftTitle] = useState('');
  const [newGiftPrice, setNewGiftPrice] = useState('');
  const [newGiftLink, setNewGiftLink] = useState('');

  const startEdit = () => {
    setDraft({ ...pet });
    setEditing(true);
  };
  const save = () => {
    const { likes, ...rest } = draft;
    onUpdate(rest);
    setEditing(false);
  };

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    if (editing) setDraft((d) => ({ ...d, photoUrl: file_url }));
    else onUpdate({ photoUrl: file_url });
    setUploading(false);
  };

  const addLike = () => {
    const v = newLike.trim();
    if (!v) return;
    onUpdate({ likes: [...(pet.likes || []), v] });
    setNewLike('');
  };
  const removeLike = (i) => onUpdate({ likes: (pet.likes || []).filter((_, idx) => idx !== i) });

  const noteItems = (pet.notes || '').split('\n').map((s) => s.trim()).filter(Boolean);
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
    onUpdate({ details: [...(pet.details || []), detail] });
    setNewDetailValue('');
    setNewDetailCustomLabel('');
  };
  const deleteDetail = (id) => onUpdate({ details: (pet.details || []).filter((x) => x.id !== id) });

  // Gifts linked to this pet — by petId (new), with legacy personId/name fallback.
  const petGifts = giftIdeas.filter((g) => {
    if (g.petId) return String(g.petId) === String(pet.id);
    if (g.personId) return String(g.personId) === String(pet.id);
    const name = typeof g.person === 'string' ? g.person.trim() : '';
    return name !== '' && name === pet.name;
  });

  const owner = people.find((p) => p.id === pet.ownerId) || null;
  const ownerBudget = owner ? personBudgets[owner.name] : null;
  // Pet gifts count against the owner's "Other" budget category specifically.
  const ownerOtherBudget = ownerBudget
    ? (typeof ownerBudget === 'number' ? ownerBudget : Number(ownerBudget.Other) || 0)
    : 0;
  const petGiftSpent = petGifts.reduce((sum, g) => sum + (Number(g.budget) || Number(g.price) || 0), 0);

  const addPetGift = () => {
    const title = newGiftTitle.trim();
    if (!title) return;
    addGiftIdea({
      title,
      link: newGiftLink.trim() || undefined,
      budget: newGiftPrice ? Number(newGiftPrice) : undefined,
      personId: pet.ownerId && pet.ownerId !== SELF_OWNER_ID ? pet.ownerId : undefined,
      petId: pet.id,
      category: 'Other',
    });
    setNewGiftTitle('');
    setNewGiftPrice('');
    setNewGiftLink('');
  };

  return (
    <div className="space-y-4">
      {/* Avatar header */}
      <div className="flex flex-col items-center pt-1 pb-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change pet photo"
          className="relative w-20 h-20 rounded-full shadow-lg shadow-primary/20"
        >
          {(editing ? draft.photoUrl : pet.photoUrl) ? (
            <img
              src={editing ? draft.photoUrl : pet.photoUrl}
              alt={pet.name}
              loading="lazy"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full ks-brand-gradient flex items-center justify-center text-primary-foreground font-display text-2xl font-semibold">
              {(pet.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <h2 className="font-display text-xl font-semibold mt-3">{pet.name || 'Add a name'}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pet.species || 'Pet'}{pet.breed ? ` · ${pet.breed}` : ''}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {editing ? 'Editing' : 'Profile'}
        </span>
        <div className="flex items-center gap-3">
          {editing ? (
            <button onClick={save} className="text-primary" aria-label="Save">
              <Check size={20} />
            </button>
          ) : (
            <button onClick={startEdit} className="inline-flex items-center justify-center h-11 w-11 -m-2 rounded-full text-primary" aria-label="Edit profile">
              <Pencil size={17} />
            </button>
          )}
          <button onClick={() => onDelete(pet.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete pet">
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <Field label="Their name">
        <Input value={pet.name} disabled className="h-11" />
      </Field>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <UserCircle2 size={13} /> Owner (connection)
        </label>
        {editing ? (
          <Select
            value={draft.ownerId || '_none'}
            onValueChange={(v) => setDraft((d) => ({ ...d, ownerId: v === '_none' ? null : v }))}
          >
            <SelectTrigger className="h-11" aria-label="Owner connection">
              <SelectValue placeholder="No connection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">No connection</SelectItem>
              {buildOwnerOptions(people, myName).map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={ownerDisplayName(pet.ownerId, people, myName)}
            disabled
            aria-label="Owner connection"
            className="h-11"
            placeholder="No connection"
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Species">
          <Input
            value={editing ? draft.species || '' : pet.species || ''}
            onChange={set('species')}
            disabled={!editing}
            className="h-11"
            placeholder="Dog, Cat, …"
          />
        </Field>
        <Field label="Breed">
          <Input
            value={editing ? draft.breed || '' : pet.breed || ''}
            onChange={set('breed')}
            disabled={!editing}
            className="h-11"
            placeholder="e.g. Golden Retriever"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="🎂 Birthday">
          <Input type="date" value={editing ? draft.birthday || '' : pet.birthday || ''} onChange={set('birthday')} disabled={!editing} className="h-11" />
        </Field>
        <Field label="🐾 Adoption day">
          <Input type="date" value={editing ? draft.adoptionDate || '' : pet.adoptionDate || ''} onChange={set('adoptionDate')} disabled={!editing} className="h-11" />
        </Field>
      </div>

      {/* Remembering — one annual date instead of birthdays, Gotcha Day and
          care reminders, for a pet who has passed or is no longer here. */}
      <div className="rounded-2xl border border-border bg-card p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Heart size={14} /> Remembering them
          </span>
          <Switch
            checked={!!(editing ? draft.remembering : pet.remembering)}
            disabled={!editing}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, remembering: v }))}
            aria-label="Remembering them"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Keeps their photos, notes and memories. Reminds you on their date instead of birthdays and check-ins.
        </p>
        {(editing ? draft.remembering : pet.remembering) && (
          <>
            <Field label="Date to remember">
              <Input
                type="date"
                value={editing ? draft.remembranceDate || '' : pet.remembranceDate || ''}
                onChange={set('remembranceDate')}
                disabled={!editing}
                className="h-11"
              />
            </Field>
            <Field label="Remind me (days before)">
              <Input
                type="number"
                min="0"
                value={editing ? (draft.remembranceLeadDays ?? DEFAULT_REMEMBRANCE_LEAD_DAYS) : (pet.remembranceLeadDays ?? DEFAULT_REMEMBRANCE_LEAD_DAYS)}
                onChange={(e) => setDraft((d) => ({ ...d, remembranceLeadDays: Number(e.target.value) }))}
                disabled={!editing}
                className="h-11"
              />
            </Field>
            <Field label="What you'd like to do">
              <Input
                value={editing ? draft.remembranceNote || '' : pet.remembranceNote || ''}
                onChange={set('remembranceNote')}
                placeholder="Visit their favorite spot…"
                disabled={!editing}
                className="h-11"
              />
            </Field>
          </>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Things They Love</label>
        {(pet.likes || []).filter(Boolean).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(pet.likes || []).filter(Boolean).map((like, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-secondary rounded-full pl-3 pr-1.5 py-1 text-sm">
                {like}
                <button
                  onClick={() => removeLike(i)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${like}`}
                >
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
        {(pet.details || []).length > 0 && (
          <div className="space-y-1.5">
            {(pet.details || []).map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-secondary/60 rounded-xl px-3 py-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">{d.label}: </span>
                  <span className="font-medium">{d.value}</span>
                </div>
                <button onClick={() => deleteDetail(d.id)} className="text-muted-foreground shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="bg-card rounded-2xl border border-border p-3 space-y-2">
          <SelectSimple value={newDetailCategory} onChange={setNewDetailCategory} options={DETAIL_CATEGORIES} />
          {newDetailCategory === 'Other' && (
            <Input
              value={newDetailCustomLabel}
              onChange={(e) => setNewDetailCustomLabel(e.target.value)}
              placeholder="Label (e.g. Groomer)"
              aria-label="Custom label"
              className="h-10"
            />
          )}
          <Input
            value={newDetailValue}
            onChange={(e) => setNewDetailValue(e.target.value)}
            placeholder="Details"
            aria-label="Details"
            className="h-10"
          />
          <Button onClick={addDetail} disabled={!newDetailValue.trim()} className="w-full h-9">
            Add
          </Button>
        </div>
      </div>

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

      <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
        <PhotoGallery photos={pet.photos} onChange={(photos) => onUpdate({ photos })} />
      </div>

      {editing && (
        <Button onClick={save} className="w-full h-12 rounded-2xl">
          Save profile
        </Button>
      )}

      <PersonCareReminders person={pet} onUpdate={onUpdate} />

      {/* Gift experiences for this pet */}
      <div className="space-y-3">
        <Link
          to={`/gift-tracker?person=${encodeURIComponent(owner?.name || '')}&pet=${pet.id}`}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 transition-colors"
        >
          <Sparkles size={16} /> Find a gift for {pet.name || 'them'} with AI
        </Link>

        {owner && (
          <p className="text-[11px] text-muted-foreground text-center">
            Gift costs count toward {owner.preferredName || owner.name}'s "Other" budget
            {ownerOtherBudget > 0 ? ` ($${petGiftSpent} of $${ownerOtherBudget})` : ''}
          </p>
        )}

        <div className="bg-card rounded-2xl border border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Gift size={15} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold">Gift experiences</h3>
            {petGifts.length > 0 && <span className="text-xs text-muted-foreground">{petGifts.length}</span>}
          </div>

          {petGifts.length > 0 && (
            <div className="space-y-1.5">
              {petGifts.map((g) => (
                <div key={g.id} className="flex items-start justify-between gap-2 bg-secondary/60 rounded-xl px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{g.title}</span>
                      {g.link && isSafeUrl(g.link) && (
                        <a href={g.link} target="_blank" rel="noopener noreferrer" aria-label="Open gift link" className="text-primary shrink-0">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {(g.budget || g.price) && (
                      <span className="text-xs text-muted-foreground">${g.budget || g.price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => cycleGiftStatus(g.id)}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                      title={g.gifted ? 'Gifted' : g.purchased ? 'Purchased' : 'Idea'}
                    >
                      {g.gifted ? 'Gifted' : g.purchased ? 'Purchased' : 'Idea'}
                    </button>
                    <button
                      onClick={() => deleteGiftIdea(g.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete gift"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <Input
              value={newGiftTitle}
              onChange={(e) => setNewGiftTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPetGift(); } }}
              placeholder="Gift experience (e.g. dog park adventure)"
              aria-label="Gift experience"
              className="h-9 text-sm"
            />
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={newGiftPrice}
                onChange={(e) => setNewGiftPrice(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPetGift(); } }}
                placeholder="Cost $"
                aria-label="Cost in dollars"
                className="h-9 text-sm w-24"
              />
              <Input
                value={newGiftLink}
                onChange={(e) => setNewGiftLink(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPetGift(); } }}
                placeholder="Link (optional)"
                aria-label="Gift link"
                className="h-9 text-sm flex-1"
              />
              <Button onClick={addPetGift} disabled={!newGiftTitle.trim()} size="sm" className="h-9 px-3">
                <Plus size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The category picker opens as the same bottom sheet as every other dropdown
// in the app, rather than a native select that would hang off the screen.
function SelectSimple({ value, onChange, options }) {
  return (
    <ResponsiveSelect
      value={value}
      onValueChange={onChange}
      ariaLabel="Detail category"
      title="Detail category"
      className="h-10 text-sm"
      options={options.map((o) => ({ value: o, label: o }))}
    />
  );
}