import React, { useMemo } from 'react';
import { Moon } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useI18n } from '@/lib/i18n/I18nContext';
import TopNav from '@/components/TopNav';
import PullToRefresh from '@/components/PullToRefresh';
import EmptyState from '@/components/EmptyState';
import MemoryComposer from '@/components/memory/MemoryComposer';
import MemoryMomentList from '@/components/memory/MemoryMomentList';
import MemorySummaryLink from '@/components/memory/MemorySummaryLink';
import { Skeleton } from '@/components/ui/skeleton';

// The user's own memory-moment space: tonight's question on top, then every
// answer they've kept, newest first.
export default function MemoryMoments() {
  useFeatureTracking('memoryMoments');
  useEnsureEntities(['personalNotes']);
  const { t } = useI18n();
  const { personalNotes, updatePersonalNote, deletePersonalNote } = useKeepsake();

  const entries = useMemo(
    () =>
      (Array.isArray(personalNotes) ? personalNotes : [])
        .filter((n) => n.type === 'memory')
        .map((n) => ({
          id: n.id,
          at: n.memoryDate || n.created_date,
          text: n.text || '',
          photos: n.photos || [],
        })),
    [personalNotes]
  );

  const pending = !Array.isArray(personalNotes);

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('memory.title')} subtitle={t('memory.subtitle')} back />

      <PullToRefresh>
        <div className="px-5 mt-2">
          <MemoryComposer />
          <MemorySummaryLink />

          <div className="mt-6 mb-3">
            <h2 className="font-display text-lg font-semibold">{t('memory.timelineTitle')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entries.length > 0 ? t('memory.timelineDescCount', { count: entries.length }) : t('memory.timelineDesc')}
            </p>
          </div>

          {pending && entries.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : entries.length > 0 ? (
            <MemoryMomentList entries={entries} onSave={updatePersonalNote} onDelete={deletePersonalNote} />
          ) : (
            <EmptyState icon={Moon} title={t('memory.empty')} subtitle={t('memory.emptyDesc')} />
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}