import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import MealTemplateEditor from '@/components/meals/MealTemplateEditor';
import { Bookmark, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

// Manage the reusable gathering templates: see what's saved, edit or delete one,
// or start a new one. Collapsed by default so the meal list stays front and centre.
export default function MealTemplatesPanel({ templates = [], onSaved, onDeleted }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { confirm, confirmDialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const summary = (tpl) =>
    [
      tpl.venueName,
      tpl.location,
      tpl.cuisine,
      tpl.budget,
      tpl.menuItems?.length ? t('meal.templateItems', { count: tpl.menuItems.length }) : '',
    ]
      .filter(Boolean)
      .join(' · ');

  const handleSaved = (saved) => {
    onSaved?.(saved);
    setEditing(null);
    toast({ title: t('meal.templateSaved'), description: saved.name });
  };

  const remove = async (tpl) => {
    const answer = await confirm({
      title: t('meal.confirmDeleteTemplate', { name: tpl.name }),
      confirmLabel: t('common.remove'),
    });
    if (!answer) return;
    await base44.entities.MealTemplate.delete(tpl.id).catch(() => {});
    onDeleted?.(tpl.id);
    toast({ title: t('meal.templateDeleted'), description: tpl.name });
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Bookmark size={15} /> {t('meal.templates')} ({templates.length})
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground">{t('meal.templatesDesc')}</p>

          {templates.length === 0 && !editing && (
            <p className="text-sm text-muted-foreground">{t('meal.noTemplates')}</p>
          )}

          {templates.length > 0 && (
            <ul className="space-y-2">
              {templates.map((tpl) => (
                <li key={tpl.id} className="rounded-xl bg-muted/50 px-3 py-2 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tpl.name}</p>
                    {summary(tpl) && <p className="text-xs text-muted-foreground truncate">{summary(tpl)}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(tpl)}
                    aria-label={t('meal.editTemplate')}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(tpl)}
                    aria-label={t('meal.deleteTemplate')}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {editing ? (
            <MealTemplateEditor
              template={editing.id ? editing : null}
              onSaved={handleSaved}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <Button variant="outline" className="h-10 w-full" onClick={() => setEditing({})}>
              <Plus size={15} className="mr-1.5" /> {t('meal.newTemplate')}
            </Button>
          )}
        </div>
      )}
      {confirmDialog}
    </div>
  );
}