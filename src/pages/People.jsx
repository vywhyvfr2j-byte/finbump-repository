import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Bell, BellOff, Search, Heart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import PartnerPersonCard from '@/components/people/PartnerPersonCard';
import PersonProfilePanel from '@/components/people/PersonProfilePanel';
import PeopleBubbles from '@/components/people/PeopleBubbles';
import PeoplePetsSection from '@/components/people/PeoplePetsSection';
import GoogleContactsSync from '@/components/people/GoogleContactsSync';
import OutlookContactsSync from '@/components/people/OutlookContactsSync';
import VCardImport from '@/components/people/VCardImport';
import PersonGiftsView from '@/components/people/PersonGiftsView';
import PersonGalleryView from '@/components/people/PersonGalleryView';
import PairingCode from '@/components/settings/PairingCode';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { RELATIONS, nextOccurrence } from '@/lib/peopleConstants';
import { KsIdeas } from '@/components/icons/KsIcons';
import { useKeepsakeUsers } from '@/hooks/useKeepsakeUsers';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function People() {
  useFeatureTracking('people');
  const { t } = useI18n();
  const { people, pets, addPerson, updatePerson, deletePerson, addPet, addEvent, partnerName, partnerPeople } = useKeepsake();
  const keepsakeEmails = useKeepsakeUsers();
  const urlParams = new URLSearchParams(window.location.search);
  const relationFilter = urlParams.get('relation');
  const qParam = urlParams.get('q') || '';
  const personParam = urlParams.get('person') || '';
  const actParam = urlParams.get('act') || '';

  const [adding, setAdding] = useState(false);
  const [setupMode, setSetupMode] = useState('manual');
  const [viewMode, setViewMode] = useState('people');
  const [activeTab, setActiveTab] = useState(relationFilter || 'all');
  const [query, setQuery] = useState('');
  const [rememberingOnly, setRememberingOnly] = useState(false);
  const [name, setName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [relation, setRelation] = useState(relationFilter || 'other');
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [notes, setNotes] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderDaysStr, setReminderDaysStr] = useState('30,7,3');

  // Non-partner people, optionally scoped to the active tab's relationship.
  const tabFilter = activeTab === 'all' ? null : activeTab;
  const rememberingCount = people.filter((p) => p.relation !== 'partner' && p.remembering).length;
  const list = people.filter(
    (p) => p.relation !== 'partner'
      && (!tabFilter || p.relation === tabFilter)
      && (!rememberingOnly || p.remembering)
  );
  const relationInfo = (key) => RELATIONS.find((r) => r.key === key) || RELATIONS[4];
  const searchList = query.trim()
    ? list.filter((p) => (p.name + ' ' + (p.preferredName || '')).toLowerCase().includes(query.trim().toLowerCase()))
    : list;
  const [selectedId, setSelectedId] = useState('');

  // Pick a sensible default selection: a ?person= id, a ?q= name match, else the first person in the (possibly filtered) list.
  useEffect(() => {
    if (!list.length) {
      setSelectedId('');
      return;
    }
    if (selectedId && list.some((p) => p.id === selectedId)) return;
    const personMatch = personParam && list.find((p) => p.id === personParam);
    const qMatch = qParam && list.find((p) => p.name.toLowerCase().includes(qParam.toLowerCase()));
    setSelectedId((personMatch || qMatch || list[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, qParam, personParam]);

  const handleAdd = () => {
    if (!name.trim()) return;
    const id = addPerson({ name: name.trim(), preferredName: preferredName.trim(), relation, birthday, anniversary, notes: notes.trim(), zipCode: zipCode.trim() });
    const reminderDays = reminderOn
      ? reminderDaysStr.split(',').map((d) => Number(d.trim())).filter((d) => !Number.isNaN(d))
      : [];
    if (birthday) {
      addEvent({ name: `${name.trim()}'s Birthday`, date: nextOccurrence(birthday), type: 'birthday', note: '', relation, personId: id, reminderDays });
    }
    if (anniversary) {
      addEvent({ name: `${name.trim()}'s Anniversary`, date: nextOccurrence(anniversary), type: 'anniversary', note: '', relation, personId: id, reminderDays });
    }
    setName(''); setPreferredName(''); setRelation(relationFilter || 'other');
    setBirthday(''); setAnniversary(''); setNotes(''); setZipCode('');
    setReminderOn(true); setReminderDaysStr('30,7,3');
    setAdding(false);
    setSelectedId(id);
  };

  if (relationFilter === 'partner') {
    return <Navigate to="/profile" replace />;
  }

  const selectedPerson = list.find((p) => p.id === selectedId) || null;
  const partner = people.find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase()));
  const ideasLink = partner ? `/ideas?person=${partner.id}` : '/ideas';

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={t('people.title')}
        subtitle={tabFilter ? relationInfo(tabFilter).label : t('people.everyoneYouTrack')}
        back
        right={
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-sm shrink-0"
            aria-label={adding ? t('people.cancel') : t('people.addPersonAria')}
          >
            {adding ? <X size={22} style={{ stroke: 'currentColor' }} /> : <Plus size={22} style={{ stroke: 'currentColor' }} />}
          </button>
        }
      />

      <div className="px-5 mt-2">
        {/* People / Gifts tab switcher */}
        <div className="flex gap-1.5 mb-4 bg-secondary/60 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setViewMode('people')}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${viewMode === 'people' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            {t('people.peopleView')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('gifts')}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${viewMode === 'gifts' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            {t('people.giftsView')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('photos')}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${viewMode === 'photos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            {t('people.photosView')}
          </button>
        </div>

        {viewMode === 'gifts' ? (
          <PersonGiftsView />
        ) : viewMode === 'photos' ? (
          <PersonGalleryView />
        ) : (
        <>
        {adding && (
          <div className="rounded-2xl border p-4 mb-5 shadow-card ks-card-tint">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSetupMode('manual')}
                className={`h-10 rounded-xl text-xs font-medium border transition-colors ${setupMode === 'manual' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground'}`}
              >
                {t('people.setupManual')}
              </button>
              <button
                type="button"
                onClick={() => setSetupMode('pair')}
                className={`h-10 rounded-xl text-xs font-medium border transition-colors ${setupMode === 'pair' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground'}`}
              >
                {t('people.pairWithCode')}
              </button>
              <button
                type="button"
                onClick={() => setSetupMode('google')}
                className={`h-10 rounded-xl text-xs font-medium border transition-colors ${setupMode === 'google' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground'}`}
              >
                {t('people.syncGoogle')}
              </button>
              <button
                type="button"
                onClick={() => setSetupMode('outlook')}
                className={`h-10 rounded-xl text-xs font-medium border transition-colors ${setupMode === 'outlook' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground'}`}
              >
                {t('people.syncOutlook')}
              </button>
              <button
                type="button"
                onClick={() => setSetupMode('file')}
                className={`h-10 rounded-xl text-xs font-medium border transition-colors ${setupMode === 'file' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground'}`}
              >
                {t('people.importFile')}
              </button>
            </div>
            {setupMode === 'pair' ? (
              <PairingCode />
            ) : setupMode === 'google' ? (
              <GoogleContactsSync />
            ) : setupMode === 'outlook' ? (
              <OutlookContactsSync />
            ) : setupMode === 'file' ? (
              <VCardImport />
            ) : (
            <div className="space-y-2.5">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('people.name')} aria-label={t('people.name')} className="h-11" autoFocus />
            <Input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder={t('people.preferredNameOptional')} aria-label={t('people.preferredName')} className="h-11" />
            <Select value={relation} onValueChange={setRelation}>
              <SelectTrigger className="h-11">
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
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground pl-1 block">{t('people.birthdayLabel')}</span>
              <Input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="h-11" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground pl-1 block">{t('people.anniversaryLabel')}</span>
              <Input type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} className="h-11" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground pl-1 block">{t('people.homeZipCode')}</span>
              <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder={t('people.zipPlaceholder')} className="h-11" />
            </label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('people.notesPlaceholder')} aria-label={t('people.notes')} className="min-h-[70px]" />
            {(birthday || anniversary) && (
              <>
                <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-3.5 py-2.5">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    {reminderOn ? <Bell size={15} /> : <BellOff size={15} />} {t('people.remindMe')}
                  </span>
                  <Switch checked={reminderOn} onCheckedChange={setReminderOn} />
                </div>
                {reminderOn && (
                  <Input value={reminderDaysStr} onChange={(e) => setReminderDaysStr(e.target.value)} placeholder={t('people.daysBefore')} aria-label={t('calendar.daysBeforeAria')} className="h-11" />
                )}
              </>
            )}
            <Button onClick={handleAdd} disabled={!name.trim()} className="w-full h-11">
              {t('people.savePerson')}
            </Button>
            </div>
            )}
          </div>
        )}

        {/* Remembering filter — keeps people who have passed or left the
            user's life in the same list, but lets them be seen on their own. */}
        {rememberingCount > 0 && (
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setRememberingOnly(false)}
              className={`h-9 px-3 rounded-full text-xs font-medium transition-colors ${!rememberingOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              Everyone
            </button>
            <button
              type="button"
              onClick={() => setRememberingOnly(true)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium transition-colors ${rememberingOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              <Heart size={13} /> Remembrance ({rememberingCount})
            </button>
          </div>
        )}

        {/* Search bar */}
        {list.length > 0 && (
          <div className="mb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('people.searchPeople')} aria-label={t('people.searchPeople')} className="h-11 pl-9" />
            </div>
          </div>
        )}

        {/* People stacked in grouped bubbles by relation — all visible at once. */}
        {list.length > 0 && (
          <PeopleBubbles
            people={searchList}
            activeTab={activeTab}
            selectedId={selectedId}
            onSelect={setSelectedId}
            keepsakeEmails={keepsakeEmails}
          />
        )}
        {list.length > 0 && query.trim() && searchList.length === 0 && (
          <p className="text-sm text-muted-foreground text-center pb-2">{t('people.noMatch', { query: query.trim() })}</p>
        )}

        {/* Pets section — collapsible card matching the people category style,
            with its own add-a-pet form (name, type, birthday). */}
        <PeoplePetsSection pets={pets} onAddPet={addPet} onAddEvent={addEvent} />

        <Link to={ideasLink} className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 transition-colors mb-4">
          <KsIdeas size={18} /> {t('people.ideas')}
        </Link>

        {list.length === 0 && !adding && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium">{t('people.noOneHere')}</p>
            <p className="text-sm mt-1">{t('people.tapToAdd')}</p>
          </div>
        )}

        {selectedPerson && (
          <PersonProfilePanel
            person={selectedPerson}
            people={people}
            keepsakeEmails={keepsakeEmails}
            onSelectPerson={setSelectedId}
            onUpdate={(patch) => updatePerson(selectedPerson.id, patch)}
            onDelete={deletePerson}
            initialActName={actParam}
          />
        )}

        {partnerName && partnerPeople.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 pl-1">
              {t('people.partnerPeople', { name: partnerName })}
            </p>
            <div className="space-y-2.5">
              {partnerPeople.map((p) => (
                <PartnerPersonCard key={p.id} person={p} />
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </div>


    </div>
  );
}