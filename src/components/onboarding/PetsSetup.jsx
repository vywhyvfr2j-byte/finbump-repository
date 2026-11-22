import React from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/I18nContext';

// The pets step of first-run setup. A pet is added the same way a person is: a
// name, a kind, and the date worth remembering. The kind defaults to Dog, the
// way a first person defaults to partner.
export const SPECIES_CHIPS = ['Dog', 'Cat', 'Bird', 'Other'];
export const newPetRow = () => ({ name: '', species: 'Dog', speciesOther: false, birthday: '' });

export default function PetsSetup({ rows, onRowsChange }) {
  const { t } = useI18n();

  const setRow = (index, patch) =>
    onRowsChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const removeRow = (index) =>
    onRowsChange(rows.length === 1 ? rows : rows.filter((_, i) => i !== index));
  const addRow = () => onRowsChange([...rows, newPetRow()]);

  return (
    <div className="px-2">
      <h2 className="font-display text-2xl font-semibold mb-2">Any pets in the family?</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Pets get their own birthday reminders and care check-ins. Skip this if you do not have any.
      </p>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-2">
              <Input
                value={row.name}
                onChange={(e) => setRow(i, { name: e.target.value })}
                placeholder="Their name"
                autoFocus={i === 0}
                className="h-11 text-base"
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label={t('common.remove')}
                  className="flex items-center justify-center w-11 h-11 -m-1 rounded-full border border-border text-muted-foreground shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
              {SPECIES_CHIPS.map((species) => {
                const selected = species === 'Other'
                  ? row.speciesOther
                  : !row.speciesOther && row.species === species;
                return (
                  <button
                    key={species}
                    type="button"
                    onClick={() => setRow(i, species === 'Other'
                      ? { speciesOther: true, species: '' }
                      : { species, speciesOther: false })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/60 text-muted-foreground'
                    }`}
                  >
                    {species}
                  </button>
                );
              })}
            </div>

            {row.speciesOther && (
              <Input
                value={row.species}
                onChange={(e) => setRow(i, { species: e.target.value })}
                placeholder="What kind? e.g. Rabbit"
                className="h-11 mt-2.5"
              />
            )}

            <label className="text-xs font-medium text-muted-foreground mt-3 mb-1.5 block">
              Their birthday
            </label>
            <Input
              type="date"
              value={row.birthday}
              onChange={(e) => setRow(i, { birthday: e.target.value })}
              className="h-11"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 w-full flex items-center justify-center gap-1.5 h-11 rounded-2xl border border-dashed border-border text-sm font-medium text-primary"
      >
        <Plus size={16} /> Add another pet
      </button>

      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        You can add photos and notes, link a pet to one of your people, and set a Gotcha Day
        reminder anytime under Explore.
      </p>
    </div>
  );
}