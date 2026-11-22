import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { actStatus, urgencyScore } from '@/lib/keepsakeUtils';
import TopNav from '@/components/TopNav';
import PullToRefresh from '@/components/PullToRefresh';
import ActRow from '@/components/ActRow';
import ActBulkBar from '@/components/acts/ActBulkBar';
import BulkEditSheet from '@/components/acts/BulkEditSheet';
import ActEditSheet from '@/components/acts/ActEditSheet';
import ActTemplates from '@/components/acts/ActTemplates';
import { ACT_TAGS, TAG_BY_KEY, CATEGORY_BY_KEY } from '@/lib/actTags';
import { Plus, Home, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useConfirm } from '@/components/ui/confirm-dialog';

const FILTERS = [
  { key: 'overdue', labelKey: 'acts.overdue' },
  { key: 'all', labelKey: 'acts.all' },
];

const SORTS = [
  { key: 'urgency', labelKey: 'acts.sortName' },
  { key: 'priority', labelKey: 'acts.sortPriority' },
  { key: 'category', labelKey: 'acts.sortSchedule' },
];

// Care-first priority order: prayer & health (care) rank above generic acts.
const PRIORITY_ORDER = ['prayer', 'health', 'act', 'other'];
const TAG_ORDER = ACT_TAGS.map((t) => t.key);

export default function ActDetail() {
  const { t } = useI18n();
  const { acts, checkOffAct, uncheckAct, deleteAct, updateAct, people } = useKeepsake();
  const [filter, setFilter] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [tagFilter, setTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency');
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editAct, setEditAct] = useState(null);
  const [generalExpanded, setGeneralExpanded] = useState(false);
  // Acts ticked off from this page celebrate and then leave the list at once,
  // so one tap clears the row from view.
  const [clearedIds, setClearedIds] = useState(() => new Set());
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();
  const { actId } = useParams();
  const focusRef = useRef(null);

  // Deep-link target: when arriving at /acts/:actId (e.g. from a push
  // notification), open the edit sheet for that specific act so the user
  // lands on the exact reminder.
  useEffect(() => {
    if (!actId || focusRef.current === actId) return;
    const a = acts.find((x) => x.id === actId);
    if (a) {
      setEditAct(a);
      focusRef.current = actId;
    }
  }, [actId, acts]);

  const toggleSelect = useCallback((id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    }),
  []);
  const clearSelection = () => setSelectedIds(new Set());
  const handleToggle = useCallback((a) => {
    if (actStatus(a) === 'fresh') return uncheckAct(a.id);
    setClearedIds((prev) => new Set(prev).add(a.id));
    return checkOffAct(a.id);
  }, [checkOffAct, uncheckAct]);
  const handleEdit = useCallback((a) => setEditAct(a), []);
  const handleSelect = useCallback((a) => toggleSelect(a.id), [toggleSelect]);
  const handleDelete = useCallback(async (a) => {
    const answer = await confirm({ title: t('acts.confirmRemove', { name: a.name }), confirmLabel: t('common.remove') });
    if (answer) deleteAct(a.id);
  }, [deleteAct, t, confirm]);
  const exitSelectMode = () => {
    setSelectMode(false);
    clearSelection();
  };
  const markSelectedComplete = () => {
    const completed = [...selectedIds].filter((id) => {
      const a = acts.find((x) => x.id === id);
      return a && actStatus(a) !== 'fresh';
    });
    completed.forEach((id) => checkOffAct(id));
    setClearedIds((prev) => new Set([...prev, ...completed]));
    clearSelection();
  };

  const deleteSelected = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const answer = await confirm({
      title: t('acts.confirmRemoveMultiple', { count: ids.length, s: ids.length === 1 ? '' : 's' }),
      confirmLabel: t('common.remove'),
    });
    if (!answer) return;
    ids.forEach((id) => deleteAct(id));
    clearSelection();
  };

  const applyBulkEdit = (patch) => {
    [...selectedIds].forEach((id) => updateAct(id, patch));
    clearSelection();
  };

  const filtered = useMemo(() => {
    const byUrgency = (a, b) => urgencyScore(b) - urgencyScore(a);
    const sorted = [...acts].sort((a, b) => {
      if (sortBy === 'priority') {
        const pa = PRIORITY_ORDER.indexOf(a.category);
        const pb = PRIORITY_ORDER.indexOf(b.category);
        if (pa !== pb) return pa - pb;
        return byUrgency(a, b);
      }
      if (sortBy === 'category') {
        const ta = TAG_ORDER.indexOf(a.tag);
        const tb = TAG_ORDER.indexOf(b.tag);
        if (ta !== tb) return ta - tb;
        return byUrgency(a, b);
      }
      return byUrgency(a, b);
    });
    let result = sorted;
    if (filter === 'overdue') result = result.filter((a) => ['overdue', 'idle', 'soon'].includes(actStatus(a)));
    if (tagFilter !== 'all') result = result.filter((a) => a.tag === tagFilter);
    return result;
  }, [acts, filter, tagFilter, sortBy]);

  // Rows the user has just ticked off leave the list — and come back if the
  // completion is undone from the toast, since an act carrying a stored
  // completion is held out of the list. Keyed on the saved completion rather
  // than on the status, because a one-time act keeps its due-date status after
  // being ticked off.
  const listActs = useMemo(
    () => filtered.filter((a) => !(clearedIds.has(a.id) && a.lastCompleted)),
    [filtered, clearedIds]
  );

  const groups = useMemo(() => {
    if (sortBy === 'priority') {
      const buckets = new Map();
      PRIORITY_ORDER.forEach((k) => buckets.set(k, []));
      listActs.forEach((act) => {
        const k = PRIORITY_ORDER.includes(act.category) ? act.category : 'other';
        buckets.get(k).push(act);
      });
      return PRIORITY_ORDER.filter((k) => buckets.get(k).length).map((k) => [t(CATEGORY_BY_KEY[k]?.labelKey) || k, buckets.get(k)]);
    }
    if (sortBy === 'category') {
      const buckets = new Map();
      TAG_ORDER.forEach((k) => buckets.set(k, []));
      listActs.forEach((act) => {
        const k = TAG_ORDER.includes(act.tag) ? act.tag : 'weekly';
        buckets.get(k).push(act);
      });
      return TAG_ORDER.filter((k) => buckets.get(k).length).map((k) => [t(TAG_BY_KEY[k]?.labelKey) || k, buckets.get(k)]);
    }
    const map = new Map();
    listActs.forEach((act) => {
      const person = people.find((p) => p.id === act.personId);
      const key = person ? (person.preferredName || person.name) : (act.person || 'General');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(act);
    });
    return [...map.entries()].sort(([a], [b]) => (a === 'General' ? -1 : b === 'General' ? 1 : a.localeCompare(b)));
  }, [listActs, people, sortBy, t]);

  return (
    <div className={`min-h-[100dvh] bg-background max-w-[440px] mx-auto ${selectMode && selectedIds.size > 0 ? 'pb-44' : 'pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]'}`}>
      <TopNav
        title={t('acts.title')}
        subtitle={t('acts.subtitle')}
        back={false}
        right={
          <>
            <button onClick={() => navigate('/')} className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary/60 transition-colors" aria-label={t('nav.home')}>
              <Home size={20} />
            </button>
            <button onClick={() => navigate('/add-act')} className="flex items-center justify-center w-11 h-11 rounded-full text-primary hover:bg-secondary/60 transition-colors" aria-label={t('acts.addActAria')}>
              <Plus size={20} />
            </button>
          </>
        }
      />

      <PullToRefresh>
      <div className="px-5 mt-2">
        <p className="font-display text-sm font-bold text-rose-900 text-center w-full tracking-wide italic mb-2 whitespace-pre-line">{t('acts.tagline')}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {t('acts.intro')}
        </p>

        <ActTemplates />

        {/* Filter pills */}
        <div className="flex gap-2 mb-2.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        {/* Sort pills */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === s.key ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setTagFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              tagFilter === 'all' ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            All categories
          </button>
          {ACT_TAGS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTagFilter(t.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                tagFilter === t.key ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border px-4 py-4 shadow-card ks-card-tint">
        <div className="space-y-6">
          {groups.map(([person, group]) => {
            const isGeneral = person === 'General';
            const neverDone = isGeneral ? group.filter((a) => !a.lastCompleted) : [];
            const showLimit = isGeneral && !generalExpanded && neverDone.length > 3;
            let ndCount = 0;
            const displayGroup = showLimit
              ? group.filter((a) => {
                  if (a.lastCompleted) return true;
                  if (ndCount < 3) { ndCount++; return true; }
                  return false;
                })
              : group;
            return (
            <div key={person}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">{person}</h2>
              <div className="space-y-2.5">
                {displayGroup.map((act) => (
                 <ActRow
                   key={act.id}
                   act={act}
                   selectable={selectMode}
                   selected={selectedIds.has(act.id)}
                   onSelect={handleSelect}
                   onToggle={handleToggle}
                   onEdit={handleEdit}
                   onDelete={handleDelete}
                   onSchedule={handleEdit}
                   personName={person}
                   stacked
                 />
                ))}
              </div>
              {showLimit && (
                <button
                  onClick={() => setGeneralExpanded(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 mt-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {t('acts.viewAllCount', { count: neverDone.length })}
                  <ChevronDown size={16} />
                </button>
              )}
            </div>
            );
          })}
          {listActs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">{t('acts.nothingOverdue')}</p>
              <p className="text-sm mt-1">{t('acts.allCaughtUp')}</p>
            </div>
          )}

          {!selectMode && (
            <button
              onClick={() => navigate('/add-act')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">{t('acts.addAnAct')}</span>
            </button>
          )}
        </div>
        </div>
      </div>
      </PullToRefresh>

      <div className="fixed inset-x-0 bottom-20 z-30 flex justify-end pr-4 pointer-events-none" style={{ maxWidth: '440px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/add-act')}
          className="pointer-events-auto w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
          aria-label={t('acts.addActAria')}
          title={t('acts.addActTitle')}
        >
          <span className="text-3xl font-light leading-none" style={{ color: '#FBF6EE' }}>+</span>
        </button>
      </div>

      <ActBulkBar
        count={selectedIds.size}
        onMarkComplete={markSelectedComplete}
        onClear={clearSelection}
        onDelete={deleteSelected}
        onEdit={() => setEditSheetOpen(true)}
      />

      <BulkEditSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        count={selectedIds.size}
        people={people}
        onApply={applyBulkEdit}
      />

      <ActEditSheet
        act={editAct}
        people={people}
        onClose={() => setEditAct(null)}
        onSave={updateAct}
        onDelete={deleteAct}
      />
      {confirmDialog}
    </div>
  );
}