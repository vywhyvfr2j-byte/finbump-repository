import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import BrandLogo from '@/components/BrandLogo';
import NoAdsNote from '@/components/NoAdsNote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight, ArrowLeft, Plus, X, Check, Mail, Sparkles,
  HelpCircle, UserCheck, BookOpen, Type,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { AUTO_FEATURES, OPTIONAL_FEATURES, PREMIUM_GROUPS, PREMIUM_POSTER } from '@/components/onboarding/featureData';
import AutoFeatureList from '@/components/onboarding/AutoFeatureList';
import OptionalFeatureList from '@/components/onboarding/OptionalFeatureList';
import FaithTraditionPicker from '@/components/onboarding/FaithTraditionPicker';
import PremiumVideoCard from '@/components/onboarding/PremiumVideoCard';
import PetsSetup, { newPetRow } from '@/components/onboarding/PetsSetup';
import FirstActSetup, { DEFAULT_ACT_SETUP, buildStarterAct } from '@/components/onboarding/FirstActSetup';
import FirstActCongrats from '@/components/onboarding/FirstActCongrats';

// The people a first-time user can name. Kept to three so setup stays short.
const RELATION_CHIPS = [
  { value: 'partner', labelKey: 'onboarding.relationPartner' },
  { value: 'family', labelKey: 'onboarding.relationFamily' },
  { value: 'friend', labelKey: 'onboarding.relationFriend' },
];
const MAX_PEOPLE = 3;

const WELCOME_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const newRow = (relation) => ({ name: '', relation, birthday: '', anniversary: '' });

export default function Onboarding({ adminPreview = false }) {
  const { t, language, setLanguage } = useI18n();
  const { completeOnboarding, updateSettings, updateMyPreferences, settings } = useKeepsake();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  // The first person defaults to partner (the app is built around that
  // relationship); the chips make it one tap to change, and everyone after is
  // family by default.
  const [rows, setRows] = useState(() => [newRow('partner')]);
  const [petRows, setPetRows] = useState(() => [newPetRow()]);
  const [userName, setUserName] = useState(user?.full_name || '');
  const [showPremium, setShowPremium] = useState(false);
  // The acts of kindness chosen during setup — each one's template, who it's
  // for and how often. They are created on finish, alongside the people they
  // belong to. `actDraft` is the act being built right now; `actJustAdded`
  // swaps the builder for the confirmation that offers another one.
  const [actSetups, setActSetups] = useState([]);
  const [actDraft, setActDraft] = useState(DEFAULT_ACT_SETUP);
  const [actJustAdded, setActJustAdded] = useState(false);
  // Text size chosen on the first adjustment step. Applied live via
  // updateSettings so the user sees the whole onboarding reflow as they pick,
  // and persisted with the rest of the settings on finish.
  const [textSize, setTextSize] = useState(settings.accessibility?.textSize || 'normal');
  // Per-feature on/off selections made during the tour. Each key maps to a
  // real setting (applied on finish), so turning a feature off here genuinely
  // stops its reminders/notifications. Defaults to on; the user opts out.
  const [selections, setSelections] = useState({
    memory: true,
    notes: true,
    prayer: true,
    encouragement: true,
    scripture: true,
    faithTradition: '',
    faithTraditionOther: '',
  });

  // Admin preview: only admins may open the read-only /onboarding route, and
  // finishing the flow there never writes to the real account.
  if (adminPreview && user?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
        <p className="text-muted-foreground text-sm">Admins only.</p>
      </div>
    );
  }

  const resetPreview = () => {
    toast({ title: 'Preview only', description: 'No data was saved to your account.' });
    setStep(0);
    setRows([newRow('partner')]);
    setPetRows([newPetRow()]);
    setUserName(user?.full_name || '');
    setShowPremium(false);
    setActSetups([]);
    setActDraft(DEFAULT_ACT_SETUP);
    setActJustAdded(false);
  };

  const named = rows.filter((r) => r.name.trim());
  const canFinishContacts = named.length > 0;
  const canFinishName = userName.trim().length > 0;
  const userEmail = user?.email || '';

  const setRow = (index, patch) =>
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const removeRow = (index) =>
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, i) => i !== index)));
  const addRow = () =>
    setRows((rs) => [...rs, newRow('family')]);

  const namedPets = petRows.filter((r) => r.name.trim());

  // Returning user — already has FinBump set up. Add nobody; just mark setup
  // complete.
  const finishReturning = () => {
    if (adminPreview) return resetPreview();
    completeOnboarding({});
    navigate('/');
  };

  // New user — persist the user's own name, create a Person entity for every
  // named contact so their dates are live in reminders from the start, and if
  // one of them is the partner, fill the partner profile from that entry.
  const finishNew = () => {
    if (adminPreview) return resetPreview();
    const name = userName.trim();
    if (name) base44.auth.updateMe({ full_name: name, onboarded: true }).catch(() => {});
    const people = named.map((r) => ({
      name: r.name.trim(),
      relation: r.relation,
      birthday: r.birthday || '',
      anniversary: r.anniversary || '',
    }));
    const partner = people.find((p) => ['partner', 'spouse'].includes(p.relation));
    // The acts of kindness set up during onboarding. The people they belong to
    // are only created on finish, so each act is matched to its person by name.
    const peopleNames = people.map((p) => p.name);
    const starterActs = actSetups.map((setup) => buildStarterAct(setup, peopleNames)).filter(Boolean);
    const pets = petRows
      .filter((r) => r.name.trim())
      .map((r) => ({ name: r.name.trim(), species: r.species, birthday: r.birthday }));
    completeOnboarding(
      partner ? { name: partner.name, birthday: partner.birthday, anniversary: partner.anniversary } : {},
      starterActs,
      people,
      pets,
    );
    // Apply the per-feature on/off selections made during the tour so opting
    // out of prayer, scripture/encouragement, memory prompts, or personal notes
    // reminders takes effect immediately.
    updateSettings({
      notifyPersonalNotes: selections.notes,
      prayerEnabled: selections.prayer,
      // Scripture is part of daily encouragement, so turning scripture on also
      // switches on the daily-encouragement master; turning it off removes
      // scripture from the generated content while leaving other encouragement.
      dailyEncouragement: selections.encouragement || selections.scripture,
      encouragementScripture: selections.scripture,
      faithTradition: selections.faithTradition || '',
      faithTraditionOther: selections.faithTradition === 'other' ? selections.faithTraditionOther?.trim() || '' : '',
    });
    updateMyPreferences({ memoryReminderEnabled: selections.memory });
    navigate('/');
  };

  // ---- step content ----

  const renderWelcome = () => (
    <div className="text-center px-2">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="mx-auto mb-4"
      >
        <BrandLogo size={72} />
      </motion.div>
      <h1 className="font-display text-3xl font-semibold mb-2 leading-tight">{t('onboarding.welcome')}</h1>
      <p className="italic text-muted-foreground text-[15px] leading-relaxed mb-3">{t('onboarding.welcomeDesc')}</p>
      <NoAdsNote className="mb-4" />

      {/* Each choice sits in its own enclosure, so a first-time user can see at a
          glance what this screen asks and skip nothing. */}
      <div className="space-y-3 text-left">
        <section aria-labelledby="ob-language" className="rounded-2xl border border-border bg-card p-3">
          <p id="ob-language" className="text-xs font-semibold text-foreground mb-2">
            {t('onboarding.chooseLanguage')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {WELCOME_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                aria-pressed={language === lang.code}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  language === lang.code
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-muted-foreground'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        {/* The question and both ways forward share one enclosure, so the choice
            reads as a single outlined section with its buttons right beneath it
            rather than a question whose answers sit far below. */}
        <section
          aria-labelledby="ob-new-or-returning"
          className="rounded-2xl border-2 border-primary/30 bg-card p-3 shadow-card"
        >
          <p id="ob-new-or-returning" className="text-sm font-semibold text-foreground">
            {t('onboarding.newOrReturning')}
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">{t('onboarding.newOrReturningHint')}</p>
          <div className="space-y-2.5">
            <Button
              onClick={() => setStep(1)}
              size="lg"
              className="w-full min-h-14 py-3.5 text-base rounded-2xl shadow-lg shadow-primary/20 whitespace-normal leading-snug"
            >
              {t('onboarding.imNew')}
              <ArrowRight size={18} className="ml-1.5" />
            </Button>
            {/* Opting out is a real choice, not a hidden link: someone who
                already knows their way around takes this straight to their
                dashboard — one tap, no confirmation, no steps to walk. */}
            <Button
              variant="outline"
              size="lg"
              onClick={finishReturning}
              className="w-full min-h-14 py-3.5 text-base rounded-2xl whitespace-normal leading-snug"
            >
              {t('onboarding.skipToDashboard')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );

  const TEXT_SIZE_OPTIONS = [
    { value: 'normal', label: 'Normal', sample: 'Aa' },
    { value: 'large', label: 'Large', sample: 'Aa' },
    { value: 'xlarge', label: 'Extra large', sample: 'Aa' },
  ];

  const pickTextSize = (value) => {
    setTextSize(value);
    updateSettings({ accessibility: { ...(settings.accessibility || {}), textSize: value } });
  };

  const renderTextSize = () => (
    <div className="px-2">
      <div className="flex items-center gap-2 mb-1">
        <Type size={20} className="text-primary" />
        <h2 className="font-display text-2xl font-semibold">Adjust text size</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-5">
        Make FinBump easier to read. Pick the size that's comfortable now — you can change it anytime in Settings.
      </p>
      <div className="space-y-2.5">
        {TEXT_SIZE_OPTIONS.map((opt) => {
          const selected = textSize === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => pickTextSize(opt.value)}
              className={`w-full flex items-center justify-between rounded-2xl border-2 p-4 transition-colors ${
                selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-display font-semibold leading-none"
                  style={{ fontSize: opt.value === 'normal' ? '20px' : opt.value === 'large' ? '26px' : '32px' }}
                >
                  {opt.sample}
                </span>
                <span className="text-sm font-medium">{opt.label}</span>
              </div>
              {selected && <Check size={20} className="text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
        The text across FinBump will match this size. Tap an option to preview it live.
      </p>
    </div>
  );

  const renderNameEmail = () => (
    <div className="px-2">
      <h2 className="font-display text-2xl font-semibold mb-2">Let's start with you</h2>
      <p className="text-muted-foreground text-sm mb-5">
        We use your name to personalize FinBump. Your email is the one on your account.
      </p>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your name</label>
      <Input
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        placeholder="Your name"
        className="h-11 text-base"
        autoFocus
      />
      <label className="text-xs font-medium text-muted-foreground mt-4 mb-1.5 block">
        Your email (on your account)
      </label>
      <div className="flex items-center gap-2 h-11 rounded-md border border-input bg-muted/40 px-3">
        <Mail size={16} className="text-muted-foreground shrink-0" />
        <span className="text-sm text-foreground truncate">{userEmail || 'Not available'}</span>
        <Check size={16} className="ml-auto text-primary shrink-0" />
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="px-2">
      <h2 className="font-display text-2xl font-semibold mb-2">Who matters most to you?</h2>
      <p className="text-muted-foreground text-sm mb-4">Add at least one person so reminders are live from day one.</p>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-2">
              <Input
                value={row.name}
                onChange={(e) => setRow(i, { name: e.target.value })}
                placeholder={t('onboarding.namePlaceholder')}
                autoFocus={i === 0}
                className="h-11 text-base"
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label={t('common.remove')}
                  className="flex items-center justify-center w-11 h-11 -m-1 rounded-full border border-border text-muted-foreground shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
              {RELATION_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setRow(i, { relation: chip.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    row.relation === chip.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  {t(chip.labelKey)}
                </button>
              ))}
            </div>

            <label className="text-xs font-medium text-muted-foreground mt-3 mb-1.5 block">
              {t('onboarding.theirBirthday')}
            </label>
            <Input
              type="date"
              value={row.birthday}
              onChange={(e) => setRow(i, { birthday: e.target.value })}
              className="h-11"
            />

            {['partner', 'spouse'].includes(row.relation) && (
              <>
                <label className="text-xs font-medium text-muted-foreground mt-3 mb-1.5 block">
                  {t('onboarding.anniversary')}
                </label>
                <Input
                  type="date"
                  value={row.anniversary}
                  onChange={(e) => setRow(i, { anniversary: e.target.value })}
                  className="h-11"
                />
              </>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 w-full flex items-center justify-center gap-1.5 h-11 rounded-2xl border border-dashed border-border text-sm font-medium text-primary"
      >
        <Plus size={16} /> {t('onboarding.addAnother')}
      </button>
    </div>
  );

  // Pets come straight after the people, added the same way: a name, a kind, and
  // the date worth remembering. None of it is required, so someone without a pet
  // simply carries on.
  const renderPets = () => <PetsSetup rows={petRows} onRowsChange={setPetRows} />;

  // Straight after naming the people they care about, the new user is invited
  // to set up their first act of kindness for one of them — the same template /
  // who / cadence building blocks the Acts page uses, pre-filled.
  const namedNames = named.map((r) => r.name.trim()).filter(Boolean);

  // Reopens the builder for a fresh act, optionally already assigned to someone.
  const startAnotherAct = (whoName) => {
    setActDraft({ ...DEFAULT_ACT_SETUP, whoName: whoName || '' });
    setActJustAdded(false);
  };

  const renderActSetup = () => {
    const lastAdded = actSetups[actSetups.length - 1];
    if (actJustAdded && lastAdded) {
      return (
        <FirstActCongrats
          actName={lastAdded.customName.trim() || lastAdded.templateName.trim()}
          personName={lastAdded.whoName}
          addedCount={actSetups.length}
          onAddSamePerson={() => startAnotherAct(lastAdded.whoName)}
          onAddSomeoneElse={() => startAnotherAct(namedNames.find((n) => n !== lastAdded.whoName))}
        />
      );
    }
    return (
      <FirstActSetup
        people={namedNames}
        value={actDraft}
        onChange={(patch) => setActDraft((s) => ({ ...s, ...patch }))}
      />
    );
  };

  const renderVerify = () => (
    <div className="px-2 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="mx-auto mb-5 w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center"
      >
        <UserCheck size={30} className="text-primary" />
      </motion.div>
      <h2 className="font-display text-2xl font-semibold mb-2">
        Welcome, {userName.trim() || 'friend'}!
      </h2>
      <p className="text-muted-foreground text-sm mb-5">Let's make sure we've got this right.</p>

      <div className="rounded-2xl border border-border bg-card p-4 text-left mb-3">
        <p className="text-xs font-medium text-muted-foreground mb-1">Your name</p>
        <p className="text-base font-semibold">{userName.trim() || '—'}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 text-left">
        <p className="text-xs font-medium text-muted-foreground mb-2">Your contacts</p>
        <ul className="space-y-1.5">
          {named.map((r, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="font-medium">{r.name.trim()}</span>
              <span className="text-xs text-muted-foreground capitalize">{r.relation}</span>
            </li>
          ))}
        </ul>
      </div>

      {namedPets.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 text-left mt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Your pets</p>
          <ul className="space-y-1.5">
            {namedPets.map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.name.trim()}</span>
                <span className="text-xs text-muted-foreground">{r.species}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">Tap Back to fix anything. Otherwise, let's take a quick tour.</p>
    </div>
  );

  // The tour's first page: everything the app already does for the user. There
  // is nothing to decide here, so it reads as a compact list rather than a stack
  // of switch cards.
  const renderAutoFeatures = () => (
    <div className="px-2">
      <h2 className="font-display text-2xl font-semibold mb-2">{AUTO_FEATURES.title}</h2>
      <p className="text-muted-foreground text-sm mb-3">{AUTO_FEATURES.subtitle}</p>
      <AutoFeatureList items={AUTO_FEATURES.items} />
      <p className="text-xs text-primary/80 mt-3 leading-relaxed">{AUTO_FEATURES.hint}</p>
    </div>
  );

  // The tour's second page: the handful of features a user may or may not want,
  // each with its own switch. Scripture's tradition picker appears only while
  // scripture is on, so the choice never shows up unasked.
  const renderOptionalFeatures = () => (
    <div className="px-2">
      <h2 className="font-display text-2xl font-semibold mb-2">{OPTIONAL_FEATURES.title}</h2>
      <p className="text-muted-foreground text-sm mb-3">{OPTIONAL_FEATURES.subtitle}</p>
      <OptionalFeatureList
        items={OPTIONAL_FEATURES.items}
        selections={selections}
        onToggle={(selKey) => setSelections((s) => ({ ...s, [selKey]: !s[selKey] }))}
      />
      {selections.scripture && (
        <FaithTraditionPicker
          className="mt-3"
          value={selections.faithTradition}
          other={selections.faithTraditionOther}
          onChange={(v) => setSelections((s) => ({ ...s, faithTradition: v }))}
          onOtherChange={(v) => setSelections((s) => ({ ...s, faithTraditionOther: v }))}
        />
      )}
    </div>
  );

  const renderPremiumGroup = (group) => (
    <div className="px-2">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-display text-2xl font-semibold">{group.title}</h2>
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
          Premium
        </span>
      </div>
      <p className="text-muted-foreground text-sm mb-4">{group.subtitle}</p>
      {group.hint && (
        <p className="text-xs text-primary/80 mb-3 leading-relaxed">{group.hint}</p>
      )}
      <div className="space-y-3">
        {group.items.map((item) => (
          <PremiumVideoCard
            key={item.name}
            name={item.name}
            desc={item.desc}
            to={item.to}
            videoUrl={item.videoUrl}
            posterUrl={item.posterUrl || PREMIUM_POSTER}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        Tap play to watch a quick demo, or try any feature in a new tab.
      </p>
    </div>
  );

  const renderPremiumOffer = () => (
    <div className="px-2 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="mx-auto mb-5 w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center"
      >
        <Sparkles size={30} className="text-primary" />
      </motion.div>
      <h2 className="font-display text-2xl font-semibold mb-2">You've got the basics covered</h2>
      <p className="text-muted-foreground text-sm mb-3">
        Want a 45-second look at the premium features? You can skip and add them anytime.
      </p>
      <p className="text-xs text-primary/80 mb-5 leading-relaxed">
        Remembrance is one of them: a quiet yearly way to honor someone you have lost.
      </p>
    </div>
  );

  const renderFinalize = () => (
    <div className="px-2 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="mx-auto mb-5 w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center"
      >
        <Check size={30} className="text-primary" />
      </motion.div>
      <h2 className="font-display text-2xl font-semibold mb-2">
        You're all set, {userName.trim() || 'friend'}!
      </h2>
      <p className="text-muted-foreground text-sm mb-5">
        Reminders for {named.map((r) => r.name.trim()).join(', ') || 'your people'} are live. Here's how to get help anytime.
      </p>

      <div className="space-y-2.5 text-left">
        <Link to="/chat" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
          <HelpCircle size={18} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">Help & Chat</p>
            <p className="text-xs text-muted-foreground">Ask anything and get instant answers.</p>
          </div>
        </Link>
        <Link to="/user-guide" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
          <BookOpen size={18} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">User Guide</p>
            <p className="text-xs text-muted-foreground">A full walkthrough of every feature.</p>
          </div>
        </Link>
      </div>
    </div>
  );

  // The ordered step list. Premium groups are only included once the user
  // opts in at the premium-offer step, so the flow stays under a minute for
  // anyone who skips them.
  const steps = [
    { type: 'welcome' },
    { type: 'nameEmail' },
    { type: 'contacts' },
    { type: 'pets' },
    { type: 'actSetup' },
    { type: 'verify' },
    { type: 'autoFeatures' },
    { type: 'optionalFeatures' },
    { type: 'premiumOffer' },
    ...(showPremium
      ? PREMIUM_GROUPS.map((g) => ({ type: 'features', group: g, tier: 'premium', optional: true }))
      : []),
    // Text size sits at the end of setup, once the user has real screens in
    // front of them to judge, rather than on a blank first screen.
    { type: 'textSize' },
    { type: 'finalize' },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  // The premium tour is opt-in, so it stays out of the count: the "Step X of Y"
  // number never jumps when the user accepts or skips it.
  const progressSteps = steps.filter((s) => !s.optional && s.type !== 'welcome');
  const stepNumber = progressSteps.indexOf(current) + 1;

  const canProceed =
    current.type === 'nameEmail' ? canFinishName
    : current.type === 'contacts' ? canFinishContacts
    : true;

  const handleNext = () => {
    if (isLast) { finishNew(); return; }
    // Entering the act step: pre-select the first person named, so the act is
    // ready to accept with one tap.
    if (current.type === 'contacts') {
      setActDraft((s) => ({ ...s, whoName: named[0]?.name.trim() || '' }));
    }
    setStep((s) => s + 1);
  };
  const handleBack = () => { if (step > 0) setStep((s) => s - 1); };

  const renderContent = () => {
    switch (current.type) {
      case 'welcome': return renderWelcome();
      case 'textSize': return renderTextSize();
      case 'nameEmail': return renderNameEmail();
      case 'contacts': return renderContacts();
      case 'pets': return renderPets();
      case 'actSetup': return renderActSetup();
      case 'verify': return renderVerify();
      case 'autoFeatures': return renderAutoFeatures();
      case 'optionalFeatures': return renderOptionalFeatures();
      case 'features': return renderPremiumGroup(current.group);
      case 'premiumOffer': return renderPremiumOffer();
      case 'finalize': return renderFinalize();
      default: return null;
    }
  };

  const renderFooter = () => {
    // The welcome screen's two buttons live with their question in the step
    // content, so this step has no separate footer.
    if (current.type === 'welcome') return null;
    if (current.type === 'actSetup') {
      // The act was just added — only moving on is left to do.
      if (actJustAdded) {
        return (
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full min-h-14 py-3.5 text-base rounded-2xl shadow-lg shadow-primary/20 whitespace-normal leading-snug"
          >
            Continue
            <ArrowRight size={18} className="ml-1.5" />
          </Button>
        );
      }
      const hasAct = !!(actDraft.customName.trim() || actDraft.templateName.trim());
      return (
        <div className="space-y-2.5">
          <Button
            onClick={() => {
              if (!hasAct) { handleNext(); return; }
              // Keep the act they just built on the list, then confirm it.
              setActSetups((list) => [...list, actDraft]);
              setActJustAdded(true);
            }}
            size="lg"
            className="w-full min-h-14 py-3.5 text-base rounded-2xl shadow-lg shadow-primary/20 whitespace-normal leading-snug"
          >
            {hasAct ? 'Add this act' : 'Continue'}
            <ArrowRight size={18} className="ml-1.5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              // Skipping clears the draft — acts already added are kept.
              setActDraft(DEFAULT_ACT_SETUP);
              setStep((s) => s + 1);
            }}
            className="w-full min-h-14 py-3.5 text-base rounded-2xl whitespace-normal leading-snug"
          >
            Skip for now
          </Button>
        </div>
      );
    }
    // Every tour step offers a way out, so someone who just wants to start using
    // the app is never walked through the whole thing.
    if (['autoFeatures', 'optionalFeatures', 'features'].includes(current.type)) {
      return (
        <div className="space-y-2.5">
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full min-h-14 py-3.5 text-base rounded-2xl shadow-lg shadow-primary/20 whitespace-normal leading-snug"
          >
            Continue
            <ArrowRight size={18} className="ml-1.5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep(steps.length - 1)}
            className="w-full min-h-14 py-3.5 text-base rounded-2xl whitespace-normal leading-snug"
          >
            {t('onboarding.skipTour')}
          </Button>
        </div>
      );
    }
    if (current.type === 'premiumOffer') {
      return (
        <div className="space-y-2.5">
          <Button
            size="lg"
            onClick={() => { setShowPremium(true); setStep((s) => s + 1); }}
            className="w-full min-h-14 py-3.5 text-base rounded-2xl shadow-lg shadow-primary/20 whitespace-normal leading-snug"
          >
            Yes, show me premium
            <ArrowRight size={18} className="ml-1.5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep((s) => s + 1)}
            className="w-full min-h-14 py-3.5 text-base rounded-2xl whitespace-normal leading-snug"
          >
            Skip for now
          </Button>
        </div>
      );
    }
    const cta = isLast ? 'Start using FinBump' : 'Continue';
    return (
      <Button
        onClick={handleNext}
        disabled={!canProceed}
        size="lg"
        className="w-full min-h-14 py-3.5 text-base rounded-2xl shadow-lg shadow-primary/20 whitespace-normal leading-snug"
      >
        {cta}
        <ArrowRight size={18} className="ml-1.5" />
      </Button>
    );
  };

  const showProgress = current.type !== 'welcome';

  // The admin preview route renders inside the app shell, where the fixed
  // bottom nav would cover the last button of a two-button footer (welcome,
  // first-act, premium offer). The real first-run flow has no nav, so only
  // the preview reserves the space — the same height the nav itself is.
  const navClearance = adminPreview ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]' : '';

  return (
    <div className={`min-h-[100dvh] flex flex-col bg-gradient-to-b from-background to-secondary/40 max-w-[440px] mx-auto ${navClearance}`}>
      <div className="flex-1 min-h-0 flex flex-col px-6 pb-6 relative overflow-y-auto">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] left-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> {t('common.back')}
          </button>
        )}

        {/* How much is left, in words: a row of dots says nothing about length. */}
        {stepNumber > 0 && (
          <p className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] right-6 text-xs font-medium text-muted-foreground">
            {t('onboarding.stepOf', { current: stepNumber, total: progressSteps.length })}
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="my-auto pt-12 pb-6"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-8">
        {/* The always-on page lists features that are built in and cannot be
            switched off, so the "change your mind" note is untrue there. */}
        {showProgress && current.type !== 'autoFeatures' && (
          <p className="text-center text-xs text-muted-foreground/80 mb-3 px-4">
            You can change your mind and add or remove any of these later in Settings.
          </p>
        )}
        {renderFooter()}
      </div>
    </div>
  );
}