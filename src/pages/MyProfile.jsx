import React, { useRef, useState, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { base44 } from '@/api/base44Client';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ResponsiveSelect from '@/components/ui/responsive-select';
import { Switch } from '@/components/ui/switch';
import { Camera, Loader2, X } from 'lucide-react';
import MyGroupsDropdown from '@/components/profile/MyGroupsDropdown';
import AppRatingSection from '@/components/profile/AppRatingSection';
import ShoppingLocationsSection from '@/components/profile/ShoppingLocationsSection';
import QuietHoursSetting from '@/components/settings/QuietHoursSetting';
import LanguageToggle from '@/components/profile/LanguageToggle';
import MemoryMomentsLink from '@/components/memory/MemoryMomentsLink';
import FoundingMemberCard from '@/components/profile/FoundingMemberCard';
import BadgeShelf from '@/components/profile/BadgeShelf';
import TrialSection from '@/components/profile/TrialSection';
import StoryCategoryPicker from '@/components/settings/StoryCategoryPicker';
import { useI18n } from '@/lib/i18n/I18nContext';

const LOVE_LANGUAGES = ['Words of affirmation', 'Quality time', 'Receiving gifts', 'Acts of service', 'Physical touch'];
const DETAIL_CATEGORIES = ['Favorite Coffee', 'Favorite Drink', 'Favorite Snack', 'Allergies', 'Dietary Restrictions', 'Clothing Size', 'Shoe Size', 'Hobbies', 'Favorite Color', 'Favorite Flower', 'Music Preference', 'Other'];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

export default function MyProfile() {
  const { t } = useI18n();
  const { settings, updateSettings, myPreferences, updateMyPreferences } = useKeepsake();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [newDetailCategory, setNewDetailCategory] = useState('Favorite Color');
  const [newDetailCustomLabel, setNewDetailCustomLabel] = useState('');
  const [newDetailValue, setNewDetailValue] = useState('');

  // Name and email must always reflect the real account owner — never a freely
  // editable value — so a paired partner can't be misled about who they're sharing with.
  useEffect(() => {
    base44.auth.me().then((user) => {
      updateSettings({ preferredName: user.full_name || '', email: user.email || '' });
    });
  }, []);

  const setS = (key) => (e) => updateSettings({ [key]: e.target.value });

  // The nickname is what the Home greeting calls the user, so it is saved on the
  // account too (not only in this browser's cache) — otherwise clearing storage
  // or opening the app elsewhere falls back to the login name.
  const nicknameTimer = useRef(null);
  const setNickname = (e) => {
    const nickname = e.target.value;
    updateSettings({ nickname });
    clearTimeout(nicknameTimer.current);
    nicknameTimer.current = setTimeout(() => {
      base44.auth.updateMe({ nickname }).catch(() => {});
    }, 700);
  };
  const setP = (key) => (e) => updateMyPreferences({ [key]: e.target.value });

  const toggleLoveLanguage = (lang) => {
    const current = myPreferences.loveLanguages || [];
    const next = current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang];
    updateMyPreferences({ loveLanguages: next });
  };

  const addDetail = () => {
    if (!newDetailValue.trim()) return;
    const label = newDetailCategory === 'Other' ? newDetailCustomLabel.trim() || 'Other' : newDetailCategory;
    const detail = { id: 'd' + Date.now(), label, value: newDetailValue.trim() };
    updateMyPreferences({ details: [...(myPreferences.details || []), detail] });
    setNewDetailValue('');
    setNewDetailCustomLabel('');
  };
  const deleteDetail = (id) => {
    updateMyPreferences({ details: (myPreferences.details || []).filter((x) => x.id !== id) });
  };

  const displayName = settings.preferredName;

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    updateSettings({ photoUrl: file_url });
    setUploading(false);
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={displayName || t('myProfile.title')} subtitle={t('myProfile.subtitle')} back />

      <div className="flex flex-col items-center px-5 pt-2 pb-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label={t('myProfile.changePhoto')}
          className="relative w-20 h-20 rounded-full shadow-lg shadow-primary/20"
        >
          {settings.photoUrl ? (
            <img src={settings.photoUrl} alt={displayName} loading="lazy" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full ks-brand-gradient flex items-center justify-center text-primary-foreground font-display text-2xl font-semibold">
              {(displayName || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" aria-label={t('myProfile.uploadPhoto')} className="hidden" onChange={handlePhotoChange} />
        <h2 className="font-display text-xl font-semibold mt-3">{displayName || t('myProfile.addName')}</h2>
      </div>

      <div className="px-5 space-y-4">
        <FoundingMemberCard />

        <BadgeShelf />

        <TrialSection />

        <LanguageToggle />

        <MemoryMomentsLink />

        <Field label={t('myProfile.name')}>
          <Input value={settings.preferredName} disabled className="h-11" />
        </Field>

        <Field label={t('myProfile.nickname')}>
          <Input value={settings.nickname} onChange={setNickname} className="h-11" placeholder={t('myProfile.nicknamePlaceholder')} />
        </Field>

        <Field label={t('myProfile.email')}>
          <Input type="email" value={settings.email} disabled className="h-11" />
        </Field>

        <MyGroupsDropdown />

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('myProfile.birthday')}>
            <Input type="date" value={myPreferences.birthday} onChange={setP('birthday')} className="h-11" />
          </Field>
          <Field label={t('myProfile.anniversary')}>
            <Input type="date" value={myPreferences.anniversary} onChange={setP('anniversary')} className="h-11" />
          </Field>
        </div>

        <Field label={t('myProfile.zipCode')}>
          <Input value={myPreferences.zipCode} onChange={setP('zipCode')} className="h-11" placeholder={t('myProfile.zipPlaceholder')} />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
          <div>
            <p className="text-sm font-medium">{t('myProfile.traveling')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('myProfile.travelingDesc')}</p>
          </div>
          <Switch
            checked={myPreferences.travelMode}
            onCheckedChange={(v) => updateMyPreferences({ travelMode: v })}
            aria-label={t('myProfile.traveling')}
          />
        </div>

        {myPreferences.travelMode && (
          <Field label={t('myProfile.travelDestination')}>
            <Input
              value={myPreferences.travelDestination}
              onChange={setP('travelDestination')}
              className="h-11"
              placeholder={t('myProfile.travelPlaceholder')}
            />
          </Field>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{t('myProfile.loveLanguages')}</label>
          <div className="flex flex-wrap gap-1.5">
            {LOVE_LANGUAGES.map((l) => {
              const active = (myPreferences.loveLanguages || []).includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLoveLanguage(l)}
                  className={`px-3.5 h-9 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{t('myProfile.additionalInfo')}</label>
          {myPreferences.details && myPreferences.details.length > 0 && (
            <div className="space-y-1.5">
              {myPreferences.details.map((d) => (
                <div key={d.id} className="flex items-center justify-between bg-secondary/60 rounded-xl px-3 py-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">{d.label}: </span>
                    <span className="font-medium">{d.value}</span>
                  </div>
                  <button onClick={() => deleteDetail(d.id)} aria-label={t('myProfile.removeDetail')} className="text-muted-foreground shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-2xl border p-3 space-y-2 shadow-card ks-card-tint">
            <ResponsiveSelect
              value={newDetailCategory}
              onValueChange={setNewDetailCategory}
              ariaLabel={t('myProfile.detailCategory')}
              title={t('myProfile.detailCategory')}
              className="h-10"
              options={DETAIL_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            {newDetailCategory === 'Other' && (
              <Input
                value={newDetailCustomLabel}
                onChange={(e) => setNewDetailCustomLabel(e.target.value)}
                placeholder={t('myProfile.customLabelPlaceholder')}
                aria-label={t('myProfile.customLabelAria')}
                className="h-10"
              />
            )}
            <Input
              value={newDetailValue}
              onChange={(e) => setNewDetailValue(e.target.value)}
              placeholder={t('myProfile.detailValuePlaceholder')}
              aria-label={t('myProfile.detailValueAria')}
              className="h-10"
            />
            <Button onClick={addDetail} disabled={!newDetailValue.trim()} className="w-full h-9">
              {t('common.add')}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{t('myProfile.thingsLove')}</label>
          {myPreferences.likes.map((like, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={like}
                onChange={(e) =>
                  updateMyPreferences({ likes: myPreferences.likes.map((v, idx) => (idx === i ? e.target.value : v)) })
                }
                className="h-11"
                placeholder={t('myProfile.lovePlaceholder')}
                aria-label={t('myProfile.loveAria')}
              />
              <button
                type="button"
                onClick={() => updateMyPreferences({ likes: myPreferences.likes.filter((_, idx) => idx !== i) })}
                className="text-muted-foreground shrink-0 p-1"
                aria-label={t('myProfile.removeAria')}
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => updateMyPreferences({ likes: [...myPreferences.likes, ''] })}
            className="w-full h-9"
          >
            {t('myProfile.addLove')}
          </Button>
        </div>

        <Field label={t('myProfile.notes')}>
          <Textarea value={myPreferences.notes} onChange={setP('notes')} rows={4} placeholder={t('myProfile.notesPlaceholder')} />
        </Field>

        <ShoppingLocationsSection />

        <QuietHoursSetting />

        <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
          <div>
            <p className="text-sm font-medium">{t('myProfile.dailyEncouragement')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('myProfile.dailyEncouragementDesc')}</p>
          </div>
          <Switch
            checked={settings.dailyEncouragement}
            onCheckedChange={(v) => updateSettings({ dailyEncouragement: v })}
            aria-label={t('myProfile.dailyEncouragement')}
          />
        </div>

        {settings.dailyEncouragement && (
          <div className="rounded-2xl border p-3.5 space-y-3 shadow-card ks-card-tint">
            <div>
              <p className="text-sm font-medium">{t('myProfile.whichItems')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('myProfile.whichItemsDesc')}</p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm">{t('myProfile.shortStory')}</span>
                  <Switch
                    checked={settings.encouragementStory !== false}
                    onCheckedChange={(v) => updateSettings({ encouragementStory: v })}
                    aria-label="Short story"
                  />
                </div>
                {settings.encouragementStory !== false && (
                  <StoryCategoryPicker
                    value={settings.storyCategories || []}
                    onChange={(v) => updateSettings({ storyCategories: v })}
                  />
                )}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm">{t('myProfile.encouragement')}</span>
                  <Switch
                    checked={settings.encouragementMessage !== false}
                    onCheckedChange={(v) => updateSettings({ encouragementMessage: v })}
                    aria-label="Encouragement"
                  />
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm">{t('myProfile.dailyScripture')}</span>
                  <Switch
                    checked={settings.encouragementScripture !== false}
                    onCheckedChange={(v) => updateSettings({ encouragementScripture: v })}
                    aria-label="Daily scripture"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-medium">{t('myProfile.faithTradition')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('myProfile.faithTraditionDesc')}</p>
            </div>
            <ResponsiveSelect
              value={settings.faithTradition || 'none'}
              onValueChange={(v) => updateSettings({ faithTradition: v === 'none' ? '' : v })}
              ariaLabel="Faith tradition"
              title="Faith tradition"
              placeholder="Choose a tradition"
              className="h-11"
              options={[
                { value: 'christian', label: 'Christian' },
                { value: 'jewish', label: 'Jewish' },
                { value: 'muslim', label: 'Muslim' },
                { value: 'buddhist', label: 'Buddhist' },
                { value: 'other', label: 'Other' },
              ]}
            />
            {settings.faithTradition === 'other' && (
              <Input
                value={settings.faithTraditionOther || ''}
                onChange={(e) => updateSettings({ faithTraditionOther: e.target.value })}
                placeholder="Your specific tradition (e.g. Bahá'í, Sikh, Wiccan)"
                aria-label="Your specific faith tradition"
                className="h-11 mt-2"
              />
            )}
            <div>
              <p className="text-sm font-medium">{t('myProfile.scriptureTopic')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('myProfile.scriptureTopicDesc')}</p>
              <Input
                value={settings.scriptureSubject || ''}
                onChange={(e) => updateSettings({ scriptureSubject: e.target.value })}
                placeholder={t('myProfile.scripturePlaceholder')}
                aria-label={t('myProfile.scriptureTopic')}
                className="h-11 mt-2"
              />
            </div>
          </div>
        )}

        <div className="pt-2">
          <AppRatingSection />
        </div>
      </div>


    </div>
  );
}