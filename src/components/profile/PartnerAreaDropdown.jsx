import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Check, Pencil, Loader2 } from 'lucide-react';
import QuickLogActs from '@/components/people/QuickLogActs';
import ScheduleAdder from '@/components/people/ScheduleAdder';
import ScheduleList from '@/components/people/ScheduleList';
import PersonGiftsInline from '@/components/people/PersonGiftsInline';
import PersonBudgetInline from '@/components/people/PersonBudgetInline';
import PartnerRelatedEntries from '@/components/profile/PartnerRelatedEntries';
import MonthlySupportSummary from '@/components/profile/MonthlySupportSummary';
import CompletedActs from '@/components/profile/CompletedActs';
import PersonHistoryLog from '@/components/people/PersonHistoryLog';
import { useKeepsake } from '@/lib/keepsakeStore';

const PARTNER_RELATIONS = [
  { key: 'partner', label: 'Partner', emoji: '💍' },
  { key: 'spouse', label: 'Spouse', emoji: '💍' },
  { key: 'husband', label: 'Husband', emoji: '🤵' },
  { key: 'wife', label: 'Wife', emoji: '👰' },
  { key: 'other', label: 'Other', emoji: '🙂' },
];

const DETAIL_CATEGORIES = ['Favorite Color', 'Favorite Flower', 'Music Preference', 'Love Language', 'Other'];

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const AREAS = [
  { value: 'personal', label: 'Profile items' },
  { value: 'memories', label: 'Memories & History' },
  { value: 'gifts', label: 'Gift Ideas' },
  { value: 'budget', label: 'Budget' },
  { value: 'care', label: 'Care & Prayer' },
];

// Dropdown of main areas for the partner profile. Personal Details and
// Memories & History render inline; Gift Ideas and Budget navigate to the
// gift tracker; Care & Prayer navigates to the existing Prayer page.
export default function PartnerAreaDropdown({ profile, editing, saving = false, startEdit, draft, setDraft, save, updateProfile, partnerPersonId, partnerPerson, initialActName = '' }) {
  const navigate = useNavigate();
  const { updatePerson } = useKeepsake();
  const [area, setArea] = useState('personal');
  const [newDetailCategory, setNewDetailCategory] = useState('Favorite Color');
  const [newDetailCustomLabel, setNewDetailCustomLabel] = useState('');
  const [newDetailValue, setNewDetailValue] = useState('');
  const [newLike, setNewLike] = useState('');

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const handleSelect = (value) => {
    if (value === 'care') {
      navigate('/prayer');
      return;
    }
    setArea(value);
  };

  // Likes and additional info belong to the partner's contact record, so each
  // change is written to that record as well as the local profile mirror.
  const saveLikes = (likes) => {
    updateProfile({ likes });
    if (partnerPerson?.id) updatePerson(partnerPerson.id, { likes: likes.filter(Boolean) });
  };
  const saveDetails = (details) => {
    updateProfile({ details });
    if (partnerPerson?.id) updatePerson(partnerPerson.id, { details });
  };

  const addLike = () => {
    const v = newLike.trim();
    if (!v) return;
    saveLikes([...(profile.likes || []), v]);
    setNewLike('');
  };
  const removeLike = (i) => saveLikes((profile.likes || []).filter((_, idx) => idx !== i));

  const addDetail = () => {
    if (!newDetailValue.trim()) return;
    const label = newDetailCategory === 'Other' ? newDetailCustomLabel.trim() || 'Other' : newDetailCategory;
    const detail = { id: 'd' + Date.now(), label, value: newDetailValue.trim() };
    saveDetails([...(profile.details || []), detail]);
    setNewDetailValue('');
    setNewDetailCustomLabel('');
  };
  const deleteDetail = (id) => saveDetails((profile.details || []).filter((x) => x.id !== id));

  return (
    <div className="space-y-4">
      <Select value={area} onValueChange={handleSelect}>
        <SelectTrigger className="h-11">
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
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Personal Details</p>
            {editing ? (
              <button
                onClick={save}
                disabled={saving}
                aria-label="Save"
                className="flex items-center justify-center w-11 h-11 -m-1.5 rounded-full text-primary disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={20} />}
              </button>
            ) : (
              <button
                onClick={startEdit}
                aria-label="Edit"
                className="flex items-center justify-center w-11 h-11 -m-1.5 rounded-full text-primary"
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
          <Field label="Their name">
            <Input
              value={editing ? draft.name || '' : profile.name || ''}
              onChange={set('name')}
              disabled={!editing}
              className="h-11"
              placeholder="Add their name"
            />
          </Field>
          <Field label="Nickname or preferred name">
            <Input
              value={editing ? draft.nickname || '' : profile.nickname || ''}
              onChange={set('nickname')}
              disabled={!editing}
              className="h-11"
              placeholder="What do you call them?"
            />
          </Field>
          <Field label="Phone number">
            <Input
              type="tel"
              value={editing ? draft.phone || '' : profile.phone || ''}
              onChange={set('phone')}
              disabled={!editing}
              className="h-11"
              placeholder="e.g. +1 555 123 4567"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Birthday">
              <Input type="date" value={editing ? draft.birthday || '' : profile.birthday || ''} onChange={set('birthday')} disabled={!editing} className="h-11" />
            </Field>
            <Field label="Anniversary">
              <Input type="date" value={editing ? draft.anniversary || '' : profile.anniversary || ''} onChange={set('anniversary')} disabled={!editing} className="h-11" />
            </Field>
          </div>

          <Field label="Home zip code">
            <Input
              value={editing ? draft.zipCode || '' : profile.zipCode || ''}
              onChange={set('zipCode')}
              disabled={!editing}
              className="h-11"
              placeholder="e.g. 60601"
            />
          </Field>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Things They Love</label>
            {(profile.likes || []).filter(Boolean).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(profile.likes || []).filter(Boolean).map((like, i) => (
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
                className="h-9 text-sm flex-1"
              />
              <Button onClick={addLike} disabled={!newLike.trim()} size="sm" className="h-9 px-3">
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Additional info</label>
            {(profile.details || []).length > 0 && (
              <div className="space-y-1.5">
                {(profile.details || []).map((d) => (
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
              <Select value={newDetailCategory} onValueChange={setNewDetailCategory}>
                <SelectTrigger className="h-10">
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
                  className="h-10"
                />
              )}
              <Input
                value={newDetailValue}
                onChange={(e) => setNewDetailValue(e.target.value)}
                placeholder="Details"
                className="h-10"
              />
              <Button onClick={addDetail} disabled={!newDetailValue.trim()} className="w-full h-9">
                Add
              </Button>
            </div>
          </div>

          <Field label="Notes">
            <Textarea
              value={editing ? draft.notes || '' : profile.notes || ''}
              onChange={set('notes')}
              disabled={!editing}
              rows={4}
              placeholder="Anything else worth remembering…"
            />
          </Field>

          {editing && (
            <Button onClick={save} disabled={saving} className="w-full h-12 rounded-2xl">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          )}

          <QuickLogActs personId={partnerPersonId} personName={profile.name} initialActName={initialActName} />
          <ScheduleAdder personName={profile.name} />
          <ScheduleList personName={profile.name} />
        </div>
      )}

      {area === 'memories' && (
        <div className="space-y-4">
          <PartnerRelatedEntries />
          <MonthlySupportSummary />
          <CompletedActs />
          <PersonHistoryLog isPartner />
        </div>
      )}

      {area === 'gifts' && <PersonGiftsInline person={partnerPerson || { name: profile.name }} />}

      {area === 'budget' && <PersonBudgetInline person={partnerPerson || { name: profile.name }} />}
    </div>
  );
}