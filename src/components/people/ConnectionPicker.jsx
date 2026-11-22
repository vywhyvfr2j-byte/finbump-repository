import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';

// Sentinel used instead of an empty string, which the Select control reserves
// for "nothing chosen yet".
export const NO_CONNECTION = 'none';

// Dropdown listing every connection (contact) name. Used wherever a milestone,
// note or timeline entry is linked to a person.
export default function ConnectionPicker({ people = [], value, onChange, id, placeholder }) {
  const { t } = useI18n();

  return (
    <Select
      value={value || NO_CONNECTION}
      onValueChange={(next) => onChange(next === NO_CONNECTION ? '' : next)}
    >
      <SelectTrigger id={id} className="h-11">
        <SelectValue placeholder={placeholder || t('timeline.linkPerson')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_CONNECTION}>{t('timeline.noConnection')}</SelectItem>
        {sortPeopleForPicker(people).map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.preferredName || p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}