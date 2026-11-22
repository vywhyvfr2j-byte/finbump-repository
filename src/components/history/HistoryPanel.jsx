import React, { useState } from 'react';
import CompletionLog from '@/components/history/CompletionLog';
import CompletionChart from '@/components/history/CompletionChart';
import HistorySkeleton from '@/components/history/HistorySkeleton';
import { List, BarChart3 } from 'lucide-react';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useI18n } from '@/lib/i18n/I18nContext';

// The history view: everything you've checked off or given, either as a
// searchable list or as a monthly chart.
export default function HistoryPanel() {
  useEnsureEntities(['history']);
  const { isLoaded } = useKeepsake();
  const [view, setView] = useState('list');
  const { t } = useI18n();

  return (
    <div className="px-5 mt-2">
      {/* View toggle */}
      <div className="flex bg-secondary/60 rounded-xl p-1 mb-4">
        <button
          onClick={() => setView('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-colors ${
            view === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          <List size={16} />
          {t('history.list')}
        </button>
        <button
          onClick={() => setView('chart')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-colors ${
            view === 'chart' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          <BarChart3 size={16} />
          {t('history.chart')}
        </button>
      </div>

      {!isLoaded ? <HistorySkeleton /> : view === 'list' ? <CompletionLog /> : <CompletionChart />}
    </div>
  );
}