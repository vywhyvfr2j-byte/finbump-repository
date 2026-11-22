import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useDebounce } from '@/hooks/useDebounce';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, HeartHandshake, Users, PawPrint, Calendar, Gift, Target, PenLine, Plane } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Declarative search config — each entry maps a store collection to its
// searchable text fields, display icon, and destination route.
export default function Search() {
  const { t } = useI18n();
  const SEARCH_GROUPS = [
    { key: 'acts', label: t('search.acts'), icon: HeartHandshake, to: '/acts', fields: ['name', 'tag', 'person'], display: 'name', sub: 'tag' },
    { key: 'people', label: t('search.people'), icon: Users, to: '/people', fields: ['name', 'relation', 'notes', 'healthNotes', 'prayerNames', 'prayerReason'], display: 'name', sub: 'relation' },
    { key: 'pets', label: t('search.pets'), icon: PawPrint, to: '/pets', fields: ['name', 'species', 'breed', 'notes'], display: 'name', sub: 'species' },
    { key: 'events', label: t('search.events'), icon: Calendar, to: '/calendar', fields: ['name', 'type', 'note'], display: 'name', sub: 'type' },
    { key: 'giftIdeas', label: t('search.gifts'), icon: Gift, to: '/gift-tracker', fields: ['title', 'note', 'category', 'occasion'], display: 'title', sub: 'category' },
    { key: 'milestones', label: t('search.milestones'), icon: Target, to: '/relationship-notes', fields: ['title', 'description'], display: 'title', sub: 'description' },
    { key: 'personalNotes', label: t('search.notes'), icon: PenLine, to: '/personal-notes', fields: ['text'], display: 'text', sub: null },
    { key: 'trips', label: t('search.trips'), icon: Plane, to: '/vacation-planner', fields: ['name', 'destination', 'notes'], display: 'name', sub: 'destination' },
  ];
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const navigate = useNavigate();
  const store = useKeepsake();

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return SEARCH_GROUPS.map(({ key, label, icon: Icon, to, fields, display, sub }) => {
      const items = store[key] || [];
      const matched = items.filter((item) =>
        fields.some((f) => (item[f] || '').toLowerCase().includes(q))
      );
      return { label, Icon, to, count: matched.length, items: matched.slice(0, 5), display, sub };
    }).filter((g) => g.count > 0);
  }, [debouncedQuery, store]);

  const totalCount = results.reduce((sum, g) => sum + g.count, 0);
  const isSearching = query !== debouncedQuery;

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('search.title')} subtitle={t('search.subtitle')} back />
      <div className="px-5 mt-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.title')}
            className="h-11 pl-10"
            autoFocus
          />
        </div>

        {query.trim() && (
          <p className="text-xs text-muted-foreground mt-3 px-1">
            {isSearching ? t('search.searching') : totalCount > 0 ? (totalCount === 1 ? t('search.resultSingle', { count: totalCount }) : t('search.resultPlural', { count: totalCount })) : t('search.noResults')}
          </p>
        )}

        <div className="mt-4 space-y-5">
          {results.map((group) => (
            <div key={group.label}>
              <button onClick={() => navigate(group.to)} className="flex items-center gap-2 mb-2 px-1">
                <group.Icon size={16} className="text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</span>
                <span className="text-[11px] text-muted-foreground">· {group.count}</span>
              </button>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const title = item[group.display] || (group.display === 'text' ? (item.text || '').slice(0, 60) : t('search.untitled'));
                  const subtitle = group.sub ? item[group.sub] : null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(group.to)}
                      className="w-full text-left rounded-xl bg-card border border-border p-3 hover:bg-secondary/60 transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{title}</p>
                      {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
                    </button>
                  );
                })}
                {group.count > 5 && (
                  <button onClick={() => navigate(group.to)} className="text-xs text-primary pl-2 pt-1">
                    {t('search.viewAll', { count: group.count })}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}