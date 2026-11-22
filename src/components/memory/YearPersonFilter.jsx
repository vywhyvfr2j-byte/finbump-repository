import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n/I18nContext';

// Who the year is about: everyone, or one person whose own notes and photos the
// reflection then gathers. Only people with something to show are offered, and
// the whole control stays out of the way when there is nobody to pick.
export default function YearPersonFilter({ people, value, onChange }) {
  const { t } = useI18n();
  if (!people.length) return null;

  return (
    <div className="mb-4">
      <Select value={value || 'all'} onValueChange={(next) => onChange(next === 'all' ? '' : next)}>
        <SelectTrigger className="h-11 rounded-xl bg-card" aria-label={t('memorySummary.whoAria')}>
          <SelectValue placeholder={t('memorySummary.everyone')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('memorySummary.everyone')}</SelectItem>
          {people.map((person) => (
            <SelectItem key={person.id} value={String(person.id)}>
              {person.preferredName || person.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}