import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useI18n } from '@/lib/i18n/I18nContext';
import EmptyState from '@/components/EmptyState';
import TimelineFilters from '@/components/timeline/TimelineFilters';
import TimelineDateFilter from '@/components/timeline/TimelineDateFilter';
import TimelineFeed from '@/components/timeline/TimelineFeed';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// One chronological view of everything worth remembering: milestones and
// personal notes merged into a single newest-first timeline. Everything is
// already loaded in the store, so no extra API calls or AI credits.
export default function TimelinePanel() {
  useFeatureTracking('timeline');
  useEnsureEntities(['personalNotes']);
  const { t } = useI18n();
  const { milestones, personalNotes, people } = useKeepsake();
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ year: 'all', month: 'all' });

  const entries = useMemo(() => {
    const nameById = new Map((people || []).map((p) => [String(p.id), p.preferredName || p.name]));
    const out = [];

    (milestones || []).forEach((m) => {
      if (!m.date) return;
      out.push({
        id: `ms-${m.id}`,
        kind: 'milestone',
        at: m.date,
        title: m.title,
        detail: m.description || '',
        completedAt: m.lastCompletedAt || null,
        personId: m.personId || null,
        personName: nameById.get(String(m.personId)) || '',
      });
    });

    (personalNotes || []).forEach((n) => {
      if (!n.created_date) return;
      out.push({
        id: `note-${n.id}`,
        kind: 'note',
        appreciation: n.type === 'appreciation',
        memory: n.type === 'memory',
        at: n.created_date,
        title: n.text || '',
        detail: '',
        personId: n.personId || null,
        personName: nameById.get(String(n.personId)) || '',
      });
    });

    return out.sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [milestones, personalNotes, people]);

  // Years the timeline actually has entries for, newest first.
  const years = useMemo(
    () => Array.from(new Set(entries.map((e) => new Date(e.at).getFullYear()))).sort((a, b) => b - a),
    [entries]
  );

  const dateActive = dateFilter.year !== 'all' || dateFilter.month !== 'all';

  const filtered = useMemo(() => {
    let list = filter === 'all' ? entries : entries.filter((e) => e.kind === filter);
    if (dateActive) {
      list = list.filter((e) => {
        const d = new Date(e.at);
        if (dateFilter.year !== 'all' && d.getFullYear() !== Number(dateFilter.year)) return false;
        if (dateFilter.month !== 'all' && d.getMonth() !== Number(dateFilter.month)) return false;
        return true;
      });
    }
    return list;
  }, [entries, filter, dateFilter, dateActive]);

  const notesPending = !Array.isArray(personalNotes);

  const counts = {
    all: entries.length,
    milestone: entries.filter((e) => e.kind === 'milestone').length,
    note: entries.filter((e) => e.kind === 'note').length,
  };

  return (
    <div className="px-5 mt-2">
      <TimelineFilters value={filter} onChange={setFilter} counts={counts} />
      <TimelineDateFilter
        year={dateFilter.year}
        month={dateFilter.month}
        years={years}
        onChange={setDateFilter}
      />

      {notesPending && filtered.length === 0 ? (
        /* Notes load on first visit — show placeholders instead of telling
           someone their timeline is empty before we know. */
        <div className="space-y-3 pt-1">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <TimelineFeed entries={filtered} />
      ) : dateActive ? (
        /* A month or year with nothing on it yet. */
        <p className="text-sm text-muted-foreground text-center py-10">{t('timeline.noDateMatches')}</p>
      ) : entries.length > 0 ? (
        /* Something is on the timeline, just not of this kind. */
        <p className="text-sm text-muted-foreground text-center py-10">
          {filter === 'milestone' ? t('relNotes.noMilestones') : t('personalNotes.empty')}
        </p>
      ) : (
        <EmptyState
          icon={Clock}
          title={t('timeline.empty')}
          subtitle={t('timeline.emptyDesc')}
          action={
            <Button asChild className="h-11 rounded-xl">
              <Link to="/relationship-notes">{t('timeline.addMilestone')}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}