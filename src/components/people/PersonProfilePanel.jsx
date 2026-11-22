import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Check, Camera, Loader2, Trash2, BadgeCheck, CalendarRange, Gift, Heart } from 'lucide-react';
import { nextRemembrance } from '@/lib/remembrance';
import { base44 } from '@/api/base44Client';
import { RELATIONS } from '@/lib/peopleConstants';
import PersonRelatedEntries from './PersonRelatedEntries';
import { useI18n } from '@/lib/i18n/I18nContext';
import ContactTimeline from './ContactTimeline';
import PersonAreaDropdown from './PersonAreaDropdown';
import PersonGoalsDropdown from './PersonGoalsDropdown';
import QuickLogActs from './QuickLogActs';
import PersonGroupBadges from './PersonGroupBadges';
import KeepsakeUserBadge from './KeepsakeUserBadge';
import { Image } from '@/components/ui/image';
import { Input } from '@/components/ui/input';
import RelationshipHealthScore from './RelationshipHealthScore';
import PhotoGallery from '@/components/shared/PhotoGallery';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

// Full profile editor + related-entries view for a non-partner person. Mirrors the
// Partner profile layout so "others" carry the same fields and surfaced data.
export default function PersonProfilePanel({ person, people = [], keepsakeEmails = {}, onSelectPerson, onUpdate, onDelete, initialActName = '' }) {
  const { t } = useI18n();
  useEnsureEntities(['movieIdeas', 'bookIdeas', 'seriesIdeas', 'treatIdeas', 'favoriteIdeas']);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [budget, setBudget] = useState(person.giftBudget || '');
  useEffect(() => setBudget(person.giftBudget || ''), [person.giftBudget]);
  const fileInputRef = useRef(null);

  const startEdit = () => {
    setDraft({ ...person });
    setEditing(true);
  };
  const save = () => {
    // likes + otherItems are managed live, so don't let the draft overwrite them.
    const { likes, otherItems, ...rest } = draft;
    onUpdate(rest);
    setEditing(false);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    if (editing) setDraft((d) => ({ ...d, photoUrl: file_url }));
    else onUpdate({ photoUrl: file_url });
    setUploading(false);
  };

  const info = RELATIONS.find((r) => r.key === person.relation) || RELATIONS[4];

  return (
    <div className="space-y-4">
      {/* Avatar header */}
      <div className="flex flex-col items-center pt-1 pb-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change profile photo"
          className="relative w-20 h-20 rounded-full shadow-lg shadow-primary/20"
        >
          {(editing ? draft.photoUrl : person.photoUrl) ? (
            <Image
              src={editing ? draft.photoUrl : person.photoUrl}
              alt={person.name}
              fittingType="fill"
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full ks-brand-gradient flex items-center justify-center text-primary-foreground font-display text-2xl font-semibold">
              {(person.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" aria-label="Upload profile photo" className="hidden" onChange={handlePhotoChange} />
        <h2 className="font-display text-xl font-semibold mt-3 flex items-center justify-center gap-1.5">
          {person.name || 'Add a name'}
          {keepsakeEmails[(person.email || '').trim().toLowerCase()] && (
            <BadgeCheck
              size={20}
              className="shrink-0"
              style={{ stroke: 'hsl(var(--primary))' }}
              aria-label={t('app.activeAccount')}
            />
          )}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{info.emoji} {info.label}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {!person.remembering && (
            <RelationshipHealthScore personId={person.id} personName={person.name} size={36} />
          )}
          {keepsakeEmails[(person.email || '').trim().toLowerCase()] && (
            <KeepsakeUserBadge variant="pill" />
          )}
        </div>
        <PersonGroupBadges personId={person.id} />
      </div>

      {person.remembering && (
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Heart size={12} /> Remembering
          </p>
          <p className="text-sm font-medium mt-1">
            {nextRemembrance(person.remembranceDate)
              ? `Next date · ${nextRemembrance(person.remembranceDate).date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`
              : 'Add a date to remember below'}
          </p>
          {person.remembranceNote && (
            <p className="text-sm text-muted-foreground mt-1">{person.remembranceNote}</p>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">
            Birthdays and check-in reminders are paused. Photos and memories stay right here.
          </p>
        </div>
      )}

      {!person.remembering && (
        <QuickLogActs personId={person.id} personName={person.name} initialActName={initialActName} />
      )}

      <Link
        to={`/memory-summary?person=${person.id}`}
        className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-secondary/15 text-secondary-foreground font-medium text-sm hover:bg-secondary/25 transition-colors"
      >
        <CalendarRange size={16} /> {t('memorySummary.seeTheirYear')}
      </Link>

      <div className="bg-secondary rounded-2xl border-2 border-primary/50 p-4 space-y-3 shadow-md">
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
            <button onClick={() => setDeleteOpen(true)} className="inline-flex items-center justify-center h-11 w-11 -m-2 rounded-full text-muted-foreground hover:text-destructive" aria-label="Delete person">
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        <PersonAreaDropdown
          person={person}
          people={people}
          editing={editing}
          draft={draft}
          setDraft={setDraft}
          save={save}
          onUpdate={onUpdate}
          onSelectPerson={onSelectPerson}
        />
      </div>

      {!person.remembering && (
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2">
          <Gift size={16} className="text-primary shrink-0" />
          <span className="text-sm font-medium shrink-0">Gift budget</span>
          <Input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onBlur={() => { if ((person.giftBudget || '') !== budget) onUpdate({ giftBudget: budget }); }}
            placeholder="Set a budget (e.g. $100)"
            className="h-9 text-sm flex-1"
            aria-label="Gift budget"
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">Track what you spend on {person.preferredName || person.name || 'them'} without digging into menus.</p>
      </div>
      )}

      <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
        <PhotoGallery photos={person.photos} onChange={(photos) => onUpdate({ photos })} title="Growth photos" />
      </div>

      <PersonRelatedEntries person={person} />

      <PersonGoalsDropdown personId={person.id} personName={person.name} />

      <ContactTimeline personId={person.id} personName={person.name} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {person.name || 'this person'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the profile and all of its reminders, acts, notes, gifts, and history. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(person.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}