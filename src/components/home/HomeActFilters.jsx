import React from 'react';
import { ACT_CATEGORIES } from '@/lib/actTags';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n/I18nContext';

// A compact filter row for the Home acts list: a contacts dropdown (replaces
// the person chips) plus category chips. filter shape:
// { type: 'all' } | { type: 'person', personId, name } | { type: 'category', category }
export default function HomeActFilters({ people, acts, filter, onChange }) {
  const { t } = useI18n();
  const Chip = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-foreground border-border hover:bg-secondary/60'
      }`}
    >
      {children}
    </button>
  );

  const mainCategories = ACT_CATEGORIES.filter((c) => c.key !== 'other');
  const otherCategory = ACT_CATEGORIES.find((c) => c.key === 'other');

  const sortedPeople = [...people].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const selectedValue =
    filter.type === 'person' ? filter.personId : 'all';

  return (
    <div className="space-y-2 -mx-1 px-1 pb-1">
      <Select
        value={selectedValue}
        onValueChange={(val) => {
          if (val === 'all') onChange({ type: 'all' });
          else {
            const p = people.find((person) => person.id === val);
            if (p) onChange({ type: 'person', personId: p.id, name: p.name });
          }
        }}
      >
        <SelectTrigger className="h-9 w-full rounded-full text-sm">
          <SelectValue placeholder={t('home.allContacts')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('home.allContacts')}</SelectItem>
          {sortedPeople.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.preferredName || p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={filter.type === 'all'} onClick={() => onChange({ type: 'all' })}>
          {t('home.filterAll')}
        </Chip>
        {mainCategories.map((c) => (
          <Chip
            key={c.key}
            active={filter.type === 'category' && filter.category === c.key}
            onClick={() => onChange({ type: 'category', category: c.key })}
          >
            {c.emoji} {c.key === 'act' ? t('home.filterActs') : c.label}
          </Chip>
        ))}
        {otherCategory && (
          <Chip
            active={filter.type === 'category' && filter.category === otherCategory.key}
            onClick={() => onChange({ type: 'category', category: otherCategory.key })}
          >
            {otherCategory.emoji} {otherCategory.label}
          </Chip>
        )}
      </div>
    </div>
  );
}