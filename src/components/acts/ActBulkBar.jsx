import React from 'react';
import { Check, X, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function ActBulkBar({ count, onMarkComplete, onClear, onDelete, onEdit }) {
  const { t } = useI18n();
  if (count === 0) return null;
  return (
    <div className="fixed bottom-20 inset-x-0 z-40 mx-auto max-w-[440px] px-5">
      <div className="flex items-center gap-2 bg-card border border-border rounded-2xl shadow-lg p-3">
        <span className="text-sm font-medium flex-1">{t('acts.bulk.selectedCount', { count })}</span>
        <Button variant="outline" size="sm" onClick={onClear} className="h-9">
          <X size={14} /> {t('acts.bulk.clear')}
        </Button>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} className="h-9">
            <Pencil size={14} /> {t('acts.bulk.edit')}
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" size="sm" onClick={onDelete} className="h-9 text-destructive hover:text-destructive">
            <Trash2 size={14} /> {t('acts.bulk.delete')}
          </Button>
        )}
        <Button size="sm" onClick={onMarkComplete} className="h-9">
          <Check size={14} /> {t('acts.bulk.done')}
        </Button>
      </div>
    </div>
  );
}