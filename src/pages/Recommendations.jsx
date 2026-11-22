import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import GiftIdeasTab from '@/components/ideas/GiftIdeasTab';
import MovieIdeasTab from '@/components/ideas/MovieIdeasTab';
import BookIdeasTab from '@/components/ideas/BookIdeasTab';
import PlaceIdeasTab from '@/components/ideas/PlaceIdeasTab';
import SeriesIdeasTab from '@/components/ideas/SeriesIdeasTab';
import TreatsTab from '@/components/ideas/TreatsTab';
import ActTemplateCreator from '@/components/ideas/ActTemplateCreator';
import SampleRecommendations from '@/components/ideas/SampleRecommendations';
import ResponsiveSelect from '@/components/ui/responsive-select';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function Recommendations() {
  useFeatureTracking('ai_gift_finder');
  useEnsureEntities(['movieIdeas', 'bookIdeas', 'seriesIdeas', 'treatIdeas', 'favoriteIdeas']);
  const { t } = useI18n();
  const TABS = [
    { key: 'gifts', label: t('ideas.tabGifts') },
    { key: 'movies', label: t('ideas.tabMovies') },
    { key: 'series', label: t('ideas.tabSeries') },
    { key: 'books', label: t('ideas.tabBooks') },
    { key: 'vacations', label: t('ideas.tabVacations') },
    { key: 'getaways', label: t('ideas.tabGetaways') },
    { key: 'dinners', label: t('ideas.tabDinners') },
    { key: 'treats', label: t('ideas.tabTreats') },
  ];
  const {
    vacationIdeas,
    addVacationIdea,
    deleteVacationIdea,
    getawayIdeas,
    addGetawayIdea,
    deleteGetawayIdea,
    dinnerIdeas,
    addFavorite,
    deleteFavorite,
    people,
  } = useKeepsake();
  const urlParams = new URLSearchParams(window.location.search);
  const [tab, setTab] = useState(urlParams.get('tab') || 'gifts');
  const highlightQuery = urlParams.get('q') || '';
  const sortedPeople = sortPeopleForPicker(people);
  const [personId, setPersonId] = useState(urlParams.get('person') || sortedPeople[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const selectedPerson = people.find((p) => p.id === personId);

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={t('ideas.title')}
        back
        subtitle={
          tab === 'gifts'
            ? selectedPerson
              ? t('ideas.subtitleGifts', { name: selectedPerson.name })
              : t('ideas.subtitleGiftsNoPerson')
            : t('ideas.subtitleOther')
        }
      />

      <div className="px-5 mt-2">
        <div className="mb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('ideas.searchPlaceholder')} className="h-11 pl-9" />
          </div>
        </div>
        {people.length > 0 && (
          <div className="mb-3">
            <ResponsiveSelect
              value={personId}
              onValueChange={setPersonId}
              title={t('ideas.choosePerson')}
              placeholder={t('ideas.choosePerson')}
              className="h-11"
              options={sortedPeople.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
        )}
        <div className="mb-5">
          <ResponsiveSelect
            value={tab}
            onValueChange={setTab}
            title={t('ideas.chooseCategory')}
            placeholder={t('ideas.chooseCategory')}
            className="h-11"
            options={TABS.map((item) => ({ value: item.key, label: item.label }))}
          />
        </div>

        {tab === 'gifts' && (
          <Link
            to="/find-it"
            className="flex items-center justify-between gap-2 rounded-2xl ks-brand-gradient px-4 py-3 text-primary-foreground shadow-lg shadow-primary/20 mb-4"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={18} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{t('ideas.aiFinderTitle')}</p>
                <p className="text-xs opacity-90 leading-tight">{t('ideas.aiFinderDesc')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="shrink-0" />
          </Link>
        )}
        {tab === 'gifts' && <GiftIdeasTab personName={selectedPerson?.name} personId={personId} searchQuery={searchQuery} />}
        {tab === 'movies' && <MovieIdeasTab personId={personId} highlightQuery={searchQuery || highlightQuery} />}
        {tab === 'series' && <SeriesIdeasTab personId={personId} highlightQuery={searchQuery || highlightQuery} />}
        {tab === 'books' && <BookIdeasTab personId={personId} highlightQuery={searchQuery || highlightQuery} />}
        {tab === 'vacations' && (
          <PlaceIdeasTab
            ideas={vacationIdeas}
            onAdd={addVacationIdea}
            onDelete={deleteVacationIdea}
            placeholder={t('ideas.vacationPlaceholder')}
            personId={personId}
          />
        )}
        {tab === 'getaways' && (
          <PlaceIdeasTab
            ideas={getawayIdeas}
            onAdd={addGetawayIdea}
            onDelete={deleteGetawayIdea}
            placeholder={t('ideas.getawayPlaceholder')}
            personId={personId}
          />
        )}
        {tab === 'dinners' && (
          <PlaceIdeasTab
            ideas={dinnerIdeas}
            onAdd={(item) => addFavorite('dinnerIdeas', item)}
            onDelete={(id) => deleteFavorite('dinnerIdeas', id)}
            placeholder={t('ideas.dinnerPlaceholder')}
          />
        )}
        {tab === 'treats' && <TreatsTab personId={personId} />}

        <ActTemplateCreator personId={personId} />

        {tab === 'gifts' && <SampleRecommendations />}
      </div>


    </div>
  );
}