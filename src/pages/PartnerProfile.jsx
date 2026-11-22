import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Camera, Loader2, Sparkles, MessageCircle, CalendarRange } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PartnerAreaDropdown from '@/components/profile/PartnerAreaDropdown';
import { findPartnerPerson, profileFromPerson, personPatchFromProfile } from '@/lib/partnerProfile';

import PartnerRelatedEntries from '@/components/profile/PartnerRelatedEntries';
import PersonGoalsDropdown from '@/components/people/PersonGoalsDropdown';
import ContactTimeline from '@/components/people/ContactTimeline';
import PhotoGallery from '@/components/shared/PhotoGallery';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useI18n } from '@/lib/i18n/I18nContext';

const PARTNER_RELATIONS_I18N = [
  { key: 'partner', labelKey: 'partner.relationPartner', emoji: '💍' },
  { key: 'spouse', labelKey: 'partner.relationSpouse', emoji: '💍' },
  { key: 'husband', labelKey: 'partner.relationHusband', emoji: '🤵' },
  { key: 'wife', labelKey: 'partner.relationWife', emoji: '👰' },
  { key: 'other', labelKey: 'partner.relationOther', emoji: '🙂' },
];

export default function PartnerProfile() {
  useEnsureEntities(['movieIdeas', 'bookIdeas', 'seriesIdeas', 'treatIdeas', 'favoriteIdeas']);
  const { t } = useI18n();
  const { profile, updateProfile, people, updatePerson } = useKeepsake();
  const partnerPerson = findPartnerPerson(people);
  // The partner's contact record is the source of truth for their details; the
  // local profile is only a mirror, so read through the record when there is one.
  const partner = profileFromPerson(partnerPerson, profile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(partner);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const startEdit = () => {
    setDraft({ ...partner });
    setEditing(true);
  };
  const save = async () => {
    const patch = personPatchFromProfile(draft);
    setSaving(true);
    try {
      // The contact record is the source of truth, so wait for the write to
      // actually land before closing the editor — retrying once, because these
      // writes can time out server-side. Telling the user it saved while the
      // record still held the old details is what made the edit look broken.
      if (partnerPerson) {
        await updatePerson(partnerPerson.id, patch).catch(() => updatePerson(partnerPerson.id, patch));
      }
      updateProfile(draft);
      setEditing(false);
      toast({ title: t('partner.saved'), duration: 2500 });
    } catch {
      toast({
        title: t('partner.saveFailed'),
        description: t('partner.saveFailedHint'),
        variant: 'destructive',
        duration: 6000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    if (editing) {
      setDraft((d) => ({ ...d, photoUrl: file_url }));
    } else {
      updateProfile({ photoUrl: file_url });
      if (partnerPerson) updatePerson(partnerPerson.id, { photoUrl: file_url });
    }
    setUploading(false);
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={partner.name || t('relation.partnerCap')}
        subtitle={t('partner.subtitle')}
        back={false}
      />

      {/* Avatar header */}
      <div className="flex flex-col items-center px-5 pt-2 pb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full shadow-lg shadow-primary/20"
        >
          {(editing ? draft.photoUrl : partner.photoUrl) ? (
            <img
              src={editing ? draft.photoUrl : partner.photoUrl}
              alt={partner.name}
              loading="lazy"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full ks-brand-gradient flex items-center justify-center text-primary-foreground font-display text-2xl font-semibold">
              {(partner.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <h2 className="font-display text-xl font-semibold mt-3">{partner.name || t('partner.addName')}</h2>
        {partnerPerson && (
          <div className="mt-2 flex items-center gap-2">
            <Select
              value={partnerPerson.relation || 'partner'}
              onValueChange={(v) => updatePerson(partnerPerson.id, { relation: v })}
            >
              <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs gap-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_RELATIONS_I18N.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.emoji} {t(r.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="px-5 space-y-4">
        <div className="space-y-2">
          <Link
            to={`/gift-tracker?person=${encodeURIComponent(partner.name || '')}`}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 transition-colors"
          >
            <Sparkles size={16} /> {partner.name ? t('partner.findGift', { name: partner.name }) : t('partner.findGiftFallback')}
          </Link>
          <Link
            to="/message-writer"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-accent/10 text-accent-foreground font-medium text-sm hover:bg-accent/15 transition-colors"
          >
            <MessageCircle size={16} /> {t('partner.writeMessage')}
          </Link>
          {partnerPerson?.id && (
            <Link
              to={`/memory-summary?person=${partnerPerson.id}`}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-secondary/15 text-secondary-foreground font-medium text-sm hover:bg-secondary/25 transition-colors"
            >
              <CalendarRange size={16} /> {t('memorySummary.seeTheirYear')}
            </Link>
          )}
        </div>

        <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
          <PartnerAreaDropdown
            profile={partner}
            editing={editing}
            saving={saving}
            startEdit={startEdit}
            draft={draft}
            setDraft={setDraft}
            save={save}
            updateProfile={updateProfile}
            partnerPersonId={partnerPerson?.id}
            partnerPerson={partnerPerson}
            initialActName={new URLSearchParams(window.location.search).get('act') || ''}
          />
        </div>

        {partnerPerson?.id && (
          <div className="rounded-2xl border p-4 shadow-card ks-card-tint">
            <PhotoGallery
              photos={partnerPerson.photos}
              onChange={(photos) => updatePerson(partnerPerson.id, { photos })}
            />
          </div>
        )}

        <PartnerRelatedEntries />

        <PersonGoalsDropdown personId={partnerPerson?.id} personName={partner.name} />

        {partnerPerson?.id && (
          <ContactTimeline personId={partnerPerson.id} personName={partner.name} />
        )}
      </div>
    </div>
  );
}