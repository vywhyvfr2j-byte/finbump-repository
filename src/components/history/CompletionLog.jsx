import React, { useMemo, useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/lib/keepsakeUtils';
import { Search, Check, Gift } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export default function CompletionLog() {
  const { acts, giftIdeas, people, history } = useKeepsake();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [personFilter, setPersonFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // Build a lookup from actId -> personId so we can filter completions by person.
  // Falls back to matching the act's `person` name against the people list for
  // older acts that were saved before personId was set.
  const actPersonMap = useMemo(() => {
    const map = new Map();
    const byName = new Map(people.map((p) => [p.name, p.id]));
    acts.forEach((a) => {
      if (!a.id) return;
      map.set(a.id, a.personId || (a.person ? byName.get(a.person) || '' : ''));
    });
    return map;
  }, [acts, people]);

  const entries = useMemo(() => {
    const actEntries = (history?.length ? history : [])
      .filter((h) => h.completedAt)
      .map((h) => ({
        id: 'comp-' + (h.id || h.actId + h.completedAt),
        name: h.actName || acts.find((a) => a.id === h.actId)?.name || 'Act',
        emoji: h.emoji,
        date: h.completedAt,
        type: 'Act',
        personId: actPersonMap.get(h.actId) || '',
      }));
    const giftEntries = giftIdeas
      .filter((g) => g.purchased && g.purchasedAt)
      .map((g) => ({
        id: 'gift-' + g.id,
        name: g.title,
        emoji: '🎁',
        date: g.purchasedAt,
        type: 'Gift',
        personId: g.personId || '',
      }));
    return [...actEntries, ...giftEntries]
      .filter((e) => (personFilter === 'all' ? true : e.personId === personFilter))
      .filter((e) => e.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [history, acts, giftIdeas, actPersonMap, personFilter, debouncedQuery]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => {
      const key = monthKey(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return [...map.entries()];
  }, [entries]);

  const monthOptions = useMemo(
    () => grouped.map(([key]) => key).sort((a, b) => b.localeCompare(a)),
    [grouped]
  );

  const filteredGrouped = useMemo(() => {
    if (monthFilter === 'all') return grouped;
    const found = grouped.find(([key]) => key === monthFilter);
    return found ? [found] : [];
  }, [grouped, monthFilter]);

  const peopleOptions = sortPeopleForPicker(people);

  return (
    <div>
      {/* Person + Month dropdowns */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Select value={personFilter} onValueChange={setPersonFilter}>
          <SelectTrigger className="h-10 rounded-xl bg-card">
            <SelectValue placeholder="All people" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All people</SelectItem>
            {peopleOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter} disabled={monthOptions.length === 0}>
          <SelectTrigger className="h-10 rounded-xl bg-card">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {monthOptions.map((key) => (
              <SelectItem key={key} value={key}>
                {monthLabel(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search completed items..."
          aria-label="Search completed items"
          className="w-full h-10 rounded-xl border border-border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No matches</p>
          <p className="text-sm mt-1">
            {personFilter !== 'all'
              ? 'No completed items for this person yet.'
              : 'Try a different search, or check off an act or gift first.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredGrouped.map(([key, items]) => (
            <div key={key}>
              {monthFilter === 'all' && (
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 sticky top-0 bg-background py-1">
                  {monthLabel(key)}
                </h2>
              )}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {items.map((e, i) => (
                  <div
                    key={e.id}
                    className={`flex items-center gap-2.5 px-3 py-2 ${
                      i > 0 ? 'border-t border-border/60' : ''
                    }`}
                  >
                    <span className="text-base shrink-0 w-6 text-center">{e.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">{e.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(e.date)}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {e.type === 'Gift' ? (
                        <Gift size={12} />
                      ) : (
                        <Check size={12} className="text-emerald-500" />
                      )}
                      <span>{e.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}