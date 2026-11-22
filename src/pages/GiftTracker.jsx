import React, { useState, useRef, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { base44 } from '@/api/base44Client';
import TopNav from '@/components/TopNav';
import PullToRefresh from '@/components/PullToRefresh';
import ResponsiveSelect from '@/components/ui/responsive-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PersonBudgetAlerts from '@/components/gifts/PersonBudgetAlerts';
import GiftSpendingSummary from '@/components/home/GiftSpendingSummary';
import GiftCategoryTile from '@/components/gifts/GiftCategoryTile';
import CategoryAddPanel from '@/components/gifts/CategoryAddPanel';
import GiftIdeaItem from '@/components/gifts/GiftIdeaItem';
import BulkActionBar from '@/components/gifts/BulkActionBar';
import GiftTemplates from '@/components/gifts/GiftTemplates';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { CATEGORIES, CATEGORY_ICONS, OCCASIONS } from '@/lib/giftConstants';
import { Sparkles, Search, X } from 'lucide-react';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import EmptyState from '@/components/EmptyState';
import AffiliateDisclosure from '@/components/AffiliateDisclosure';
import { KsGifts } from '@/components/icons/KsIcons';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function GiftTracker({ title, showBudgetSummary = true }) {
  useFeatureTracking('gift_tracker');
  const { t } = useI18n();
  const resolvedTitle = title || t('gifts.title');
  const { giftIdeas, addGiftIdea, toggleGiftPurchased, cycleGiftStatus, deleteGiftIdea, updateGiftIdea, people, updatePerson, vacationIdeas, trips, myPreferences, personBudgets, acts, history } = useKeepsake();
  const urlParams = new URLSearchParams(window.location.search);
  const personParam = urlParams.get('person') || '';
  const petParam = urlParams.get('pet') || '';
  const budgetParam = urlParams.get('budget') === '1';
  const sortedPeople = sortPeopleForPicker(people);
  const [selectedPersonId, setSelectedPersonId] = useState(
    () => people.find((p) => p.name === personParam)?.id || sortedPeople[0]?.id || ''
  );
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // Guarantee the dropdown always points at a real person so the gift list is
  // strictly scoped to the selected name — fixes the case where people load
  // after first paint and the selection stays blank.
  useEffect(() => {
    if (!sortedPeople.length) return;
    if (!selectedPersonId || !people.find((p) => p.id === selectedPersonId)) {
      const fromQuery = people.find((p) => p.name === personParam);
      setSelectedPersonId(fromQuery?.id || sortedPeople[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedPeople, selectedPersonId, personParam]);

  const [aiLoadingCategory, setAiLoadingCategory] = useState(null);
  const [aiFinderLoading, setAiFinderLoading] = useState(false);
  const [aiKeyword, setAiKeyword] = useState('');
  const [aiBudgetMin, setAiBudgetMin] = useState('');
  const [aiBudgetMax, setAiBudgetMax] = useState('');
  const [aiCount, setAiCount] = useState('3');
  // Pre-fill the AI budget max with the owner's "Other" budget when arriving
  // from a pet profile — pet gifts count against that category.
  const petBudgetPrefilled = useRef(false);
  const giftListRef = useRef(null);
  const budgetRef = useRef(null);
  const [budgetOpenSignal, setBudgetOpenSignal] = useState(0);
  const goToPersonGifts = (id) => {
    setSelectedPersonId(id);
    setFilter('All');
    setTimeout(() => {
      giftListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };
  const goToPersonBudget = (row) => {
    setSelectedPersonId(row.id);
    setFilter('All');
    setBudgetOpenSignal((s) => s + 1);
    setTimeout(() => {
      budgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // Quick-add idea form state (merged from the old Gift Ideas page).
  const [qTitle, setQTitle] = useState('');
  const [qLink, setQLink] = useState('');
  const [qTargetDate, setQTargetDate] = useState('');
  const [qBudget, setQBudget] = useState('');
  const [qOccasion, setQOccasion] = useState('Other');

  const matchedPerson = people.find((p) => p.id === selectedPersonId) || null;
  const selectedPerson = matchedPerson?.name || '';

  // When arriving from a pet profile (?pet=...), pre-fill the AI Gift Finder's
  // budget max with the owner's "Other" budget amount so suggestions stay within
  // the connection's "Other" category limit.
  useEffect(() => {
    if (!petParam || !matchedPerson || petBudgetPrefilled.current) return;
    const b = personBudgets?.[selectedPerson];
    if (!b) return;
    const otherAmount = typeof b === 'number' ? b : Number(b.Other) || 0;
    if (otherAmount > 0) {
      setAiBudgetMax(String(otherAmount));
      petBudgetPrefilled.current = true;
    }
  }, [petParam, matchedPerson, selectedPerson, personBudgets]);

  // When arriving from a contact's "Budget" area link (?budget=1), jump
  // straight to the per-person budget section.
  useEffect(() => {
    if (!budgetParam || !matchedPerson) return;
    const t = setTimeout(() => budgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetParam, matchedPerson]);

  // Total of the per-person budget across all occasions — used to cap AI suggestions at 2×.
  const personBudgetTotal = (() => {
    const b = personBudgets?.[selectedPerson];
    if (!b) return 0;
    if (typeof b === 'number') return b;
    return Object.values(b).reduce((sum, v) => sum + (Number(v) || 0), 0);
  })();
  // Only fall back to matching by name for legacy ideas with no personId, and only when
  // that name isn't shared by more than one person — otherwise it's impossible to tell
  // who the idea was really meant for, so we treat it as unassigned rather than guess.
  const nameCounts = people.reduce((acc, p) => ({ ...acc, [p.name]: (acc[p.name] || 0) + 1 }), {});
  const belongsToSelected = (g) => {
    // Strict per-person scope — match by personId only against the chosen person.
    // The name fallback is reserved for genuine legacy ideas saved before personId
    // was tracked, and only matches when the resolved person's name is unique across
    // everyone in the picker, so a gift can never bleed across people.
    if (g.personId) {
      return !!selectedPersonId && String(g.personId) === String(selectedPersonId);
    }
    const personName = (typeof g.person === 'string' ? g.person : '').trim();
    return !!selectedPerson && personName !== '' && personName === selectedPerson && nameCounts[selectedPerson] === 1;
  };

  const handleActualCost = (id, value) => {
    updateGiftIdea(id, { actualCost: value ? Number(value) : null });
  };

  const handleAdd = (category, { title, link, budget }) => {
    addGiftIdea({ title, link, targetDate: '', category, person: selectedPerson, personId: selectedPersonId || null, budget });
  };

  const handleQuickAdd = () => {
    if (!qTitle.trim() || !matchedPerson) return;
    addGiftIdea({
      title: qTitle.trim(),
      link: qLink.trim(),
      targetDate: qTargetDate,
      category: 'Other',
      occasion: qOccasion,
      person: selectedPerson,
      personId: selectedPersonId,
      budget: qBudget ? Number(qBudget) : null,
    });
    setQTitle('');
    setQLink('');
    setQTargetDate('');
    setQBudget('');
    setQOccasion('Other');
  };

  const getAge = (birthday) => {
    if (!birthday) return null;
    const dob = new Date(birthday);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const notYetBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
    if (notYetBirthday) age -= 1;
    return age;
  };

  const handleAISuggest = async (category) => {
    if (!matchedPerson) return;
    setAiLoadingCategory(category);
    const personGiftTitles = giftIdeas.filter(belongsToSelected).map((g) => g.title);
    const otherTitles = giftIdeas.filter((g) => !belongsToSelected(g)).map((g) => g.title);
    const prefValue = matchedPerson?.preferences?.[category];
    const age = getAge(matchedPerson?.birthday);
    const zipCode = matchedPerson?.zipCode;
    const isTravelCategory = category === 'Experiences' && (prefValue || '').toLowerCase() === 'travel';
    const myVacationDestination = myPreferences.travelMode ? myPreferences.travelDestination : null;
    // Only surface trip destinations when the user has disclosed travel
    // (travelMode enabled) or is currently on an ongoing trip — otherwise trips
    // are private planning data and excluded from the AI gift context.
    const today = new Date().toISOString().slice(0, 10);
    const isOnVacation = trips.some((t) => {
      if (!t.startDate) return false;
      const start = t.startDate.slice(0, 10);
      const end = (t.endDate || t.startDate).slice(0, 10);
      return start <= today && today <= end;
    });
    const travelDisclosed = !!myVacationDestination || isOnVacation;
    const allLocations = travelDisclosed ? trips.flatMap((t) => t.locations || []) : [];
    const currentOrNextLocation =
      allLocations.find((l) => l.startDate && l.endDate && l.startDate <= today && today <= l.endDate) ||
      [...allLocations].filter((l) => l.startDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    const destination = myVacationDestination
      ? null
      : travelDisclosed
        ? currentOrNextLocation?.destination ||
          (isTravelCategory
            ? vacationIdeas.find((v) => v.personId === matchedPerson?.id)?.destination || trips[0]?.destination
            : null)
        : null;

    // Acts of kindness scoped to this contact — tells the AI what support the
    // user has been providing so gift suggestions complement rather than
    // duplicate the care already being shown.
    const personActs = (acts || []).filter(
      (a) => (a.personId && String(a.personId) === String(selectedPersonId)) ||
             (!a.personId && a.person && a.person === selectedPerson)
    );
    const completedActNames = (history || [])
      .filter((h) => personActs.some((a) => a.id === h.actId))
      .map((h) => h.actName);
    const likesList = (matchedPerson?.likes || []).filter(Boolean);
    const detailsList = (matchedPerson?.details || []).filter((d) => d?.value).map((d) => `${d.label}: ${d.value}`);
    const otherItemsList = (matchedPerson?.otherItems || []).filter(Boolean);

    const context = [
      `Suggest 3 thoughtful ${category} gift ideas for ${selectedPerson}.`,
      matchedPerson?.relation ? `Their relationship to me: ${matchedPerson.relation}.` : '',
      age != null ? `They are ${age} years old.` : '',
      matchedPerson?.notes ? `Notes about them: ${matchedPerson.notes}.` : '',
      prefValue ? `Their ${category} preference: ${prefValue}.` : '',
      likesList.length ? `Things they like: ${likesList.join(', ')}.` : '',
      detailsList.length ? `Additional details about them — ${detailsList.join('; ')}.` : '',
      otherItemsList.length ? `Other things to know about them — ${otherItemsList.join('; ')}.` : '',
      matchedPerson?.healthNotes ? `Health/personal situation notes: ${matchedPerson.healthNotes}.` : '',
      personActs.length
        ? `Acts of kindness I already do for them: ${personActs.map((a) => a.name).join(', ')}${completedActNames.length ? `. Recently completed: ${completedActNames.slice(0, 5).join(', ')}` : ''}. Use these to understand our relationship and suggest gifts that complement this care.`
        : '',
      personGiftTitles.length
        ? `Gift ideas already marked for them on the gift tracker — avoid repeating these: ${personGiftTitles.join(', ')}.`
        : '',
      otherTitles.length
        ? `For context, here are gift ideas already saved for other people — don't suggest these: ${otherTitles.join(', ')}.`
        : '',
      myVacationDestination
        ? `I am currently traveling near ${myVacationDestination} — prioritize local shops, boutiques, or experiences near that destination instead of my home zip code, since that's where I'll be shopping.`
        : destination
        ? `They have an upcoming trip to ${destination} — focus these suggestions on travel gear, experiences, or things related to that destination, not their home location.`
        : zipCode
        ? `Also include local shops, boutiques, or experiences within 30 miles of zip code ${zipCode} that would work well for this category.`
        : '',
      personBudgetTotal > 0
        ? `Each gift idea must not cost more than $${personBudgetTotal * 2} (twice the budget you set for ${selectedPerson}).`
        : '',
      'For each idea give a short title, a one-sentence reason, an estimated budget in USD, and a direct link to the exact product page (not a search results page, category page, or marketplace landing page) where it can be bought. The link must point to one specific product listing, e.g. https://www.etsy.com/listing/12345/... not https://www.etsy.com/market/...',
    ].filter(Boolean).join(' ');

    const shoppingLocations = (myPreferences.shoppingLocations || []).filter(Boolean);
    const res = await base44.functions.invoke('suggest-gifts', { prompt: context, includeCategory: false, shoppingLocations, category });

    (res.data.suggestions || []).forEach((s) => {
      const cap = personBudgetTotal > 0 ? personBudgetTotal * 2 : null;
      addGiftIdea({
        title: s.title,
        category,
        person: selectedPerson,
        personId: selectedPersonId,
        budget: s.budget != null && cap != null ? Math.min(s.budget, cap) : (s.budget ?? null),
        note: s.reason || '',
        link: s.link || '',
        source: 'ai',
      });
    });
    setAiLoadingCategory(null);
  };

  const handleAIGiftFinder = async () => {
    if (!matchedPerson) return;
    setAiFinderLoading(true);
    try {
      const personGiftTitles = giftIdeas.filter(belongsToSelected).map((g) => g.title);
      const otherTitles = giftIdeas.filter((g) => !belongsToSelected(g)).map((g) => g.title);
      const age = getAge(matchedPerson?.birthday);
      const zipCode = matchedPerson?.zipCode;
      const allPreferences = Object.entries(matchedPerson?.preferences || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`);
      const myVacationDestination = myPreferences.travelMode ? myPreferences.travelDestination : null;
      // Only surface trip destinations when the user has disclosed travel
      // (travelMode enabled) or is currently on an ongoing trip.
      const today = new Date().toISOString().slice(0, 10);
      const isOnVacation = trips.some((t) => {
        if (!t.startDate) return false;
        const start = t.startDate.slice(0, 10);
        const end = (t.endDate || t.startDate).slice(0, 10);
        return start <= today && today <= end;
      });
      const travelDisclosed = !!myVacationDestination || isOnVacation;
      const allLocations = travelDisclosed ? trips.flatMap((t) => t.locations || []) : [];
      const currentOrNextLocation =
        allLocations.find((l) => l.startDate && l.endDate && l.startDate <= today && today <= l.endDate) ||
        [...allLocations].filter((l) => l.startDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
      const destination = myVacationDestination
        ? null
        : travelDisclosed
          ? currentOrNextLocation?.destination || vacationIdeas.find((v) => v.personId === matchedPerson?.id)?.destination || trips[0]?.destination
          : null;

      const countNum = Math.max(1, Math.min(3, parseInt(aiCount, 10) || 3));
      const minNum = aiBudgetMin ? Number(aiBudgetMin) : null;
      const maxNum = aiBudgetMax ? Number(aiBudgetMax) : null;
      const budgetLine =
        minNum != null && maxNum != null
          ? `Each idea's estimated budget in USD must fall between $${minNum} and $${maxNum}.`
          : minNum != null
          ? `Each idea's estimated budget in USD should be at least $${minNum}.`
          : maxNum != null
          ? `Each idea's estimated budget in USD should be at most $${maxNum}.`
          : '';
      // Hard ceiling: never let an AI-suggested gift exceed twice the user's max budget.
      const maxCeil = maxNum != null ? maxNum * 2 : null;

      // Acts of kindness scoped to this contact — same enrichment as the
      // per-category suggester, so the Gift Finder also understands the
      // relationship through the support the user has been providing.
      const personActs = (acts || []).filter(
        (a) => (a.personId && String(a.personId) === String(selectedPersonId)) ||
               (!a.personId && a.person && a.person === selectedPerson)
      );
      const completedActNames = (history || [])
        .filter((h) => personActs.some((a) => a.id === h.actId))
        .map((h) => h.actName);
      const likesList = (matchedPerson?.likes || []).filter(Boolean);
      const detailsList = (matchedPerson?.details || []).filter((d) => d?.value).map((d) => `${d.label}: ${d.value}`);
      const otherItemsList = (matchedPerson?.otherItems || []).filter(Boolean);

      const context = [
        `Suggest ${countNum} thoughtful gift ideas across different categories for ${selectedPerson}.`,
        budgetLine,
        maxCeil != null ? `Each gift idea must not cost more than $${maxCeil} (twice the max budget).` : '',
        aiKeyword.trim() ? `The user wants ideas focused on these keywords/theme: "${aiKeyword.trim()}".` : '',
        matchedPerson?.relation ? `Their relationship to me: ${matchedPerson.relation}.` : '',
        age != null ? `They are ${age} years old.` : '',
        matchedPerson?.birthday ? `Their birthday is ${matchedPerson.birthday}.` : '',
        matchedPerson?.anniversary ? `Our anniversary is ${matchedPerson.anniversary}.` : '',
        matchedPerson?.notes ? `Notes about them: ${matchedPerson.notes}.` : '',
        allPreferences.length ? `Their personal preferences — ${allPreferences.join('; ')}.` : '',
        likesList.length ? `Things they like: ${likesList.join(', ')}.` : '',
        detailsList.length ? `Additional details about them — ${detailsList.join('; ')}.` : '',
        otherItemsList.length ? `Other things to know about them — ${otherItemsList.join('; ')}.` : '',
        matchedPerson?.healthNotes ? `Health/personal situation notes: ${matchedPerson.healthNotes}.` : '',
        personActs.length
          ? `Acts of kindness I already do for them: ${personActs.map((a) => a.name).join(', ')}${completedActNames.length ? `. Recently completed: ${completedActNames.slice(0, 5).join(', ')}` : ''}. Use these to understand our relationship and suggest gifts that complement this care.`
          : '',
        personGiftTitles.length
          ? `Gift ideas already saved for them — avoid repeating these: ${personGiftTitles.join(', ')}.`
          : '',
        otherTitles.length
          ? `For context, here are gift ideas already saved for other people — don't suggest these: ${otherTitles.join(', ')}.`
          : '',
        myVacationDestination
          ? `I am currently traveling near ${myVacationDestination} — prioritize local shops, boutiques, or experiences near that destination instead of my home zip code.`
          : destination
          ? `They have an upcoming trip to ${destination} — consider travel gear or experiences related to that destination.`
          : zipCode
          ? `Also include local shops, boutiques, or experiences within 30 miles of zip code ${zipCode} where relevant.`
          : '',
        `Assign each idea to one of these categories: ${CATEGORIES.join(', ')}.`,
        'For each idea give a short title, the category, a one-sentence reason, an estimated budget in USD, and a direct link to the exact product page (not a search results page, category page, or marketplace landing page) where it can be bought. The link must point to one specific product listing, e.g. https://www.etsy.com/listing/12345/... not https://www.etsy.com/market/...',
      ].filter(Boolean).join(' ');

      const shoppingLocations = (myPreferences.shoppingLocations || []).filter(Boolean);
      const res = await base44.functions.invoke('suggest-gifts', { prompt: context, includeCategory: true, shoppingLocations });

      (res.data.suggestions || []).forEach((s) => {
        const cat = CATEGORIES.includes(s.category) ? s.category : 'Other';
        const cap = maxCeil != null ? maxCeil : null;
        addGiftIdea({
          title: s.title,
          category: cat,
          person: selectedPerson,
          personId: selectedPersonId,
          budget: s.budget != null && cap != null ? Math.min(s.budget, cap) : (s.budget ?? null),
          note: s.reason || '',
          link: s.link || '',
          source: 'ai',
        });
      });
    } finally {
      setAiFinderLoading(false);
    }
  };

  const searchActive = searchQuery.trim().length > 0;
  const searchNeeds = searchQuery.trim().toLowerCase();
  const byPerson = giftIdeas.filter(belongsToSelected);
  // When searching, drop the per-person and per-category scoping and match
  // across every gift idea by title or category so the user can find items
  // anywhere in their lists.
  const searchMatches = searchActive
    ? giftIdeas.filter((g) => {
        const title = (g.title || '').toLowerCase();
        const category = (g.category || 'Other').toLowerCase();
        return title.includes(searchNeeds) || category.includes(searchNeeds);
      })
    : [];
  const filteredIdeas = searchActive
    ? searchMatches
    : filter === 'All'
    ? byPerson
    : byPerson.filter((g) => (g.category || 'Other') === filter);

  // Drop any selections that no longer match the current person/filter so the bulk
  // bar never references gifts the user can't see.
  useEffect(() => {
    setSelectedIds((prev) => {
      const visibleIds = new Set(filteredIdeas.map((g) => g.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredIdeas]);

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());
  const selectAllVisible = () => setSelectedIds(new Set(filteredIdeas.map((g) => g.id)));
  const bulkDelete = () => {
    [...selectedIds].forEach((id) => deleteGiftIdea(id));
    clearSelection();
  };
  const bulkMoveCategory = (category) => {
    [...selectedIds].forEach((id) => updateGiftIdea(id, { category }));
    clearSelection();
  };
  const bulkSetStatus = (status) => {
    [...selectedIds].forEach((id) =>
      updateGiftIdea(id, {
        purchased: status !== 'Idea',
        gifted: status === 'Gifted',
        giftedAt: status === 'Gifted' ? new Date().toISOString() : null,
        purchasedAt: status !== 'Idea' ? new Date().toISOString() : null,
      })
    );
    clearSelection();
  };

  const subtitle = matchedPerson ? t('gifts.subtitleFor', { name: selectedPerson }) : t('gifts.noPersonSelected');

  return (
    <div className={`min-h-[100dvh] bg-background max-w-[440px] mx-auto ${selectedIds.size > 0 ? 'pb-44' : 'pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]'}`}>
      <TopNav title={resolvedTitle} subtitle={subtitle} />

      <PullToRefresh>
      {showBudgetSummary && <GiftSpendingSummary hideLink onRowClick={goToPersonBudget} />}
      <div className="px-5 mt-2">
        {/* Global search — searches across all people and categories by title or category */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('gifts.searchAll')}
            aria-label={t('gifts.searchAria')}
            className="h-11 pl-9 pr-9"
          />
          {searchActive && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={t('gifts.clearSearchAria')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {sortedPeople.length > 0 && (
          <div className="mb-4">
            <ResponsiveSelect
              value={selectedPersonId}
              onValueChange={setSelectedPersonId}
              ariaLabel={t('gifts.choosePersonAria')}
              title={t('gifts.choosePerson')}
              placeholder={t('gifts.choosePerson')}
              className="h-11"
              options={sortedPeople.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
        )}

        {/* Quick add an idea (merged from the old Gift Ideas page) */}
        <div className="rounded-2xl border p-4 space-y-2.5 mb-5 shadow-card ks-card-tint">
          <Input
            value={qTitle}
            onChange={(e) => setQTitle(e.target.value)}
            placeholder={t('gifts.giftIdea')}
            aria-label={t('gifts.giftIdeaAria')}
            className="h-11"
          />
          <Input value={qLink} onChange={(e) => setQLink(e.target.value)} placeholder={t('gifts.linkOptional')} aria-label={t('gifts.linkAria')} className="h-11" />
          <div className="flex gap-2">
            <Input type="date" value={qTargetDate} onChange={(e) => setQTargetDate(e.target.value)} aria-label={t('gifts.targetDateAria')} className="h-11" />
            <Input
              type="number"
              value={qBudget}
              onChange={(e) => setQBudget(e.target.value)}
              placeholder={t('gifts.budgetPlaceholder')}
              aria-label={t('gifts.budgetAria')}
              className="h-11"
            />
          </div>
          <ResponsiveSelect
            value={qOccasion}
            onValueChange={setQOccasion}
            ariaLabel={t('gifts.occasionAria')}
            title={t('gifts.occasion')}
            placeholder={t('gifts.occasion')}
            className="h-11"
            options={OCCASIONS.map((o) => ({ value: o, label: o }))}
          />
          <Button onClick={handleQuickAdd} disabled={!qTitle.trim() || !matchedPerson} className="w-full h-11 rounded-xl">
            {t('gifts.saveIdea')}
          </Button>
        </div>

        <GiftTemplates
          disabled={!matchedPerson}
          onAdd={(item) =>
            addGiftIdea({
              ...item,
              person: selectedPerson,
              personId: selectedPersonId || null,
            })
          }
        />

        {matchedPerson && (
          <div className="bg-accent/20 rounded-2xl border border-accent/40 p-4 mb-5">
            <div className="flex items-center gap-3">
              <Sparkles className="text-accent-foreground shrink-0" size={18} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{t('gifts.aiFinder')}</p>
                <p className="text-xs text-muted-foreground">{t('gifts.aiFinderDesc')}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Input
                value={aiKeyword}
                onChange={(e) => setAiKeyword(e.target.value)}
                placeholder={t('gifts.keywordsPlaceholder')}
                aria-label={t('gifts.keywordsAria')}
                className="h-10"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={aiBudgetMin}
                  onChange={(e) => setAiBudgetMin(e.target.value)}
                  placeholder={t('gifts.budgetMin')}
                  aria-label={t('gifts.budgetMinAria')}
                  className="h-10"
                  inputMode="numeric"
                />
                <Input
                  type="number"
                  min="0"
                  value={aiBudgetMax}
                  onChange={(e) => setAiBudgetMax(e.target.value)}
                  placeholder={t('gifts.budgetMax')}
                  aria-label={t('gifts.budgetMaxAria')}
                  className="h-10"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {t('gifts.howMany')}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="3"
                  value={aiCount}
                  onChange={(e) => setAiCount(e.target.value)}
                  placeholder="3"
                  aria-label={t('gifts.howManyAria')}
                  className="h-10"
                  inputMode="numeric"
                />
              </div>
              <Button onClick={handleAIGiftFinder} disabled={aiFinderLoading} className="w-full h-10 rounded-xl">
                {aiFinderLoading ? t('gifts.thinking') : t('gifts.findIdeas')}
              </Button>
            </div>
          </div>
        )}

        <div ref={budgetRef} className="scroll-mt-2">
          {matchedPerson && (
            <PersonBudgetAlerts
              giftIdeas={giftIdeas}
              people={people}
              selectedPersonId={selectedPersonId}
              onSelectPerson={goToPersonGifts}
              openSignal={budgetOpenSignal}
            />
          )}
        </div>

        {matchedPerson && (
          <div className="mb-5">
            <ResponsiveSelect
              value={filter}
              onValueChange={setFilter}
              ariaLabel={t('gifts.filterCategoryAria')}
              title={t('gifts.allCategories')}
              placeholder={t('gifts.allCategories')}
              className="h-11"
              options={[
                { value: 'All', label: t('gifts.allCategories') },
                ...CATEGORIES.map((c) => ({
                  value: c,
                  label: matchedPerson?.preferences?.[c] ? `${c} — ${matchedPerson.preferences[c]}` : c,
                })),
              ]}
            />
          </div>
        )}

        {matchedPerson && filter !== 'All' && (
          <div className="mb-2.5">
            <GiftCategoryTile
              category={filter}
              Icon={CATEGORY_ICONS[filter]}
              active
              onToggle={() => setFilter('All')}
              person={matchedPerson}
              prefValue={matchedPerson?.preferences?.[filter]}
              onUpdatePreference={(val) =>
                updatePerson(matchedPerson.id, { preferences: { ...(matchedPerson.preferences || {}), [filter]: val } })
              }
            />
          </div>
        )}

        {matchedPerson && filter !== 'All' && (
          <>
            <CategoryAddPanel
              category={filter}
              personName={selectedPerson}
              onAdd={(item) => handleAdd(filter, item)}
              onAISuggest={() => handleAISuggest(filter)}
              aiLoading={aiLoadingCategory === filter}
            />
            <button onClick={() => setFilter('All')} className="text-xs font-medium text-primary mb-3">
              {t('gifts.clearFilter')}
            </button>
          </>
        )}

        <div ref={giftListRef} className="scroll-mt-2">
        <div className="rounded-2xl border px-4 py-4 shadow-card space-y-2.5 ks-card-tint">
          {filteredIdeas.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground -mb-1">
              <span>{selectedIds.size > 0 ? t('gifts.selectedOfTotal', { count: selectedIds.size, total: filteredIdeas.length }) : (filteredIdeas.length === 1 ? t('gifts.ideaSingular', { count: filteredIdeas.length }) : t('gifts.ideaPlural', { count: filteredIdeas.length }))}</span>
              {selectedIds.size > 0 ? (
                <button type="button" onClick={clearSelection} className="font-medium text-primary">
                  {t('gifts.clear')}
                </button>
              ) : (
                <button type="button" onClick={selectAllVisible} className="font-medium text-primary">
                  {t('gifts.selectAll')}
                </button>
              )}
            </div>
          )}
          {filteredIdeas.map((g) => (
            <GiftIdeaItem
              key={g.id}
              idea={g}
              people={people}
              onToggle={toggleGiftPurchased}
              onCycleStatus={cycleGiftStatus}
              onDelete={deleteGiftIdea}
              onSaveActualCost={handleActualCost}
              onSaveEdit={updateGiftIdea}
              selected={selectedIds.has(g.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
          {filteredIdeas.length === 0 && (
            <EmptyState
              icon={searchActive ? Search : KsGifts}
              title={searchActive ? t('gifts.noMatchTitle', { query: searchQuery.trim() }) : matchedPerson ? t('gifts.noIdeasForPerson', { name: selectedPerson }) : t('gifts.noIdeasYet')}
              subtitle={searchActive ? t('gifts.noMatchSubtitle') : matchedPerson ? t('gifts.noIdeasForPersonSubtitle') : t('gifts.noIdeasSubtitle')}
            />
          )}
          {filteredIdeas.length > 0 && <AffiliateDisclosure />}
        </div>
        </div>
      </div>
      </PullToRefresh>

      <BulkActionBar
        count={selectedIds.size}
        onClear={clearSelection}
        onDelete={bulkDelete}
        onMoveCategory={bulkMoveCategory}
        onSetStatus={bulkSetStatus}
      />


    </div>
  );
}