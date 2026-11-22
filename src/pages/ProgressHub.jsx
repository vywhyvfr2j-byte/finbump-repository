import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import FeatureGate from '@/components/ops/FeatureGate';
import SectionSearch from '@/components/progress/SectionSearch';
import SectionResults from '@/components/progress/SectionResults';
import ProgressPanel from '@/components/progress/ProgressPanel';
import HistoryPanel from '@/components/history/HistoryPanel';
import TimelinePanel from '@/components/timeline/TimelinePanel';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useI18n } from '@/lib/i18n/I18nContext';
import { TrendingUp, History as HistoryIcon, Clock } from 'lucide-react';
import FbIcon from '@/components/icons/FbIcon';

// One section for how much support you've given, what you've done, and the
// moments worth remembering. The three views live behind tabs here instead of
// as three separate destinations, and the query box searches all of them at
// once. Progress keeps its own Premium gate so history and timeline stay
// available to everyone.
const TABS = [
  { id: 'progress', labelKey: 'progress.title', Icon: TrendingUp, fbIcon: 'completion-history' },
  { id: 'history', labelKey: 'history.title', Icon: HistoryIcon, fbIcon: 'history' },
  { id: 'timeline', labelKey: 'timeline.title', Icon: Clock, fbIcon: 'timeline' },
];

export default function ProgressHub() {
  useEnsureEntities(['history', 'personalNotes', 'goals']);
  const { t } = useI18n();

  const requested = new URLSearchParams(window.location.search).get('tab');
  const [tab, setTab] = useState(TABS.some((item) => item.id === requested) ? requested : 'progress');
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('nav.progressHistory')} subtitle={t('progressHistory.subtitle')} back />

      <div className="mt-2">
        <div className="px-5">
          <SectionSearch value={query} onChange={setQuery} />

          {!searching && (
            <div className="flex bg-secondary/60 rounded-xl p-1 mb-4">
              {TABS.map(({ id, labelKey, Icon, fbIcon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[13px] font-medium transition-colors ${
                    tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {fbIcon ? <FbIcon name={fbIcon} style="color" size={17} /> : <Icon size={15} />}
                  {t(labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        {searching ? (
          <div className="px-5">
            <SectionResults query={query} />
          </div>
        ) : (
          <>
            {tab === 'progress' && (
              <FeatureGate feature="progressChart" premium>
                <ProgressPanel />
              </FeatureGate>
            )}
            {tab === 'history' && <HistoryPanel />}
            {tab === 'timeline' && <TimelinePanel />}
          </>
        )}
      </div>
    </div>
  );
}