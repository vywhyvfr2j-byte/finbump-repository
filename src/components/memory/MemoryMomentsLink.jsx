import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Moon } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useI18n } from '@/lib/i18n/I18nContext';

// Entry point from the user's own profile to their memory-moment timeline.
export default function MemoryMomentsLink() {
  useEnsureEntities(['personalNotes']);
  const { t } = useI18n();
  const { personalNotes } = useKeepsake();
  const count = Array.isArray(personalNotes)
    ? personalNotes.filter((n) => n.type === 'memory').length
    : null;

  return (
    <Link to="/memory" className="flex items-center gap-3 rounded-xl border border-border p-3.5">
      <Moon size={18} className="text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{t('memory.linkTitle')}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {count ? t('memory.linkCount', { count }) : t('memory.linkDesc')}
        </p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}