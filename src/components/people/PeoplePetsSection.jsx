import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, ChevronDown, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { nextOccurrence } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';

const EMPTY_DRAFT = { name: '', species: '', birthday: '' };

// Pets inside the contacts area: the pets already added, plus a name / type /
// birthday form of their own, so a pet is set up right here instead of on
// another page. Saving a birthday plants the yearly reminder too, the same way
// it does for a person above.
export default function PeoplePetsSection({ pets, onAddPet, onAddEvent, defaultOpen = true }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const patch = (fields) => setDraft((d) => ({ ...d, ...fields }));

  const toggleAdd = () => {
    setOpen(true);
    setAdding((v) => !v);
  };

  const handleAdd = () => {
    const name = draft.name.trim();
    if (!name) return;
    const id = onAddPet({ name, species: draft.species.trim(), birthday: draft.birthday });
    if (draft.birthday) {
      onAddEvent({
        name: t('pets.birthdayEvent', { name }),
        date: nextOccurrence(draft.birthday),
        type: 'birthday',
        note: '',
        personId: id,
      });
    }
    setDraft(EMPTY_DRAFT);
    setAdding(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden mb-4">
      <div className="flex items-center pr-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex-1 flex items-center gap-2 px-4 h-12 text-sm font-semibold"
        >
          <PawPrint size={18} />
          Pets
          <span className="text-xs font-normal text-muted-foreground">{pets.length}</span>
          <ChevronDown
            size={18}
            className={`ml-auto text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={toggleAdd}
          aria-label={adding ? t('people.cancel') : t('pets.addPetBtn')}
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0 after:content-[''] after:absolute after:-inset-1.5"
        >
          {adding ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {open && (
        <div className="px-4 pb-3.5">
          {adding && (
            <div
              className="rounded-xl border p-3 mb-3.5 ks-card-tint"
            >
              <div className="space-y-2.5">
                <Input
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder={t('pets.namePlaceholder')}
                  aria-label={t('pets.namePlaceholder')}
                  className="h-11"
                  autoFocus
                />
                <Input
                  value={draft.species}
                  onChange={(e) => patch({ species: e.target.value })}
                  placeholder={t('pets.speciesPlaceholder')}
                  aria-label={t('pets.speciesAria')}
                  className="h-11"
                />
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground pl-1 block">
                    {t('pets.birthdayLabel')}
                  </span>
                  <Input
                    type="date"
                    value={draft.birthday}
                    onChange={(e) => patch({ birthday: e.target.value })}
                    aria-label={t('pets.birthdayAria')}
                    className="h-11"
                  />
                </label>
                <Button onClick={handleAdd} disabled={!draft.name.trim()} className="w-full h-11">
                  {t('pets.savePet')}
                </Button>
              </div>
            </div>
          )}

          {pets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pets.map((p) => (
                <Link
                  key={p.id}
                  to={`/pets?pet=${p.id}`}
                  className="flex items-center gap-2 h-11 px-3.5 rounded-full border bg-background text-foreground border-border hover:bg-secondary/60 transition-colors"
                >
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" loading="lazy" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <PawPrint size={16} />
                  )}
                  <span className="text-sm font-medium leading-none">{p.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            !adding && (
              <div className="pb-1">
                <p className="text-sm text-muted-foreground">{t('pets.noPetsDesc')}</p>
                <Button onClick={toggleAdd} variant="outline" className="w-full h-11 mt-3">
                  <Plus size={16} /> {t('pets.addPetBtn')}
                </Button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}