import React from 'react';
import { Pencil, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// The messages the user saved for the people they support. Tap one to fill the
// message box instantly; the pencil renames or rewrites it, the small × removes it.
export default function SavedMessageTemplates({ templates, onPick, onEdit, onRemove }) {
  const { t } = useI18n();
  if (!templates.length) return null;

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('home.savedMessages')}</label>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {templates.map((tpl) => (
          <span
            key={tpl.id}
            className="flex items-center gap-1 shrink-0 max-w-[250px] rounded-full bg-secondary pl-3.5 pr-1.5 py-1.5"
          >
            <button
              type="button"
              onClick={() => onPick(tpl.text)}
              className="text-xs text-left truncate text-secondary-foreground"
            >
              {tpl.title || tpl.text}
            </button>
            <button
              type="button"
              onClick={() => onEdit(tpl)}
              aria-label={t('home.messageTemplate.editAria')}
              className="shrink-0 text-muted-foreground hover:text-primary"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={() => onRemove(tpl)}
              aria-label={t('home.savedMessagesRemoveAria')}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}