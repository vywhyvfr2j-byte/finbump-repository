import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

// Chip list plus free-text entry for a gathering's dishes or menu items.
// Shared by the new-meal form and the template editor.
export default function MenuItemsInput({ items = [], onChange }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    if (!items.includes(value)) onChange([...items, value]);
    setDraft('');
  };

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('meal.menuLabel')}</p>

      {items.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-2">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-1 pl-3 pr-1.5 h-8 rounded-full bg-muted/60 text-xs">
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== item))}
                aria-label={t('meal.removeMenuItem', { item })}
                className="p-0.5 text-muted-foreground hover:text-destructive"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={t('meal.menuPlaceholder')}
          aria-label={t('meal.menuLabel')}
          className="h-10"
        />
        <Button variant="outline" className="h-10 shrink-0" onClick={add}>
          {t('meal.add')}
        </Button>
      </div>
    </div>
  );
}