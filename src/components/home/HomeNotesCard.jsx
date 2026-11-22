import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotebookPen, ChevronRight, Flag } from 'lucide-react';
import { formatDate } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';

// The two most recent milestones from Relationship Notes, gathered into their
// own card so the dashboard keeps that thread visible without opening the page.
// Milestones are already part of the loaded store, so this adds no fetch; the
// header link goes to Relationship Notes, where goals live too.
export default function HomeNotesCard({ milestones, people }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const recent = useMemo(
    () =>
      [...(milestones || [])]
        .filter((m) => m.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 2),
    [milestones]
  );

  const nameById = useMemo(
    () => new Map((people || []).map((p) => [String(p.id), p.preferredName || p.name])),
    [people]
  );

  return (
    <div className="px-5 mt-3">
      <section
        className="rounded-2xl border border-border bg-card px-4 py-4 shadow-card"
        aria-labelledby="home-notes-heading"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="home-notes-heading" className="font-display text-base font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/60 text-primary">
              <NotebookPen size={16} />
            </span>
            {t('home.relNotesCard')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/relationship-notes')}
            className="inline-flex items-center gap-0.5 min-h-[44px] -my-2.5 text-xs font-medium text-primary"
          >
            {t('home.viewAll')} <ChevronRight size={14} />
          </button>
        </div>

        {recent.length > 0 ? (
          <div className="rounded-xl border border-border/70 divide-y divide-border/70 overflow-hidden mt-2.5">
            {recent.map((m) => {
              const personName = nameById.get(String(m.personId));
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => navigate('/relationship-notes')}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-secondary/40 transition-colors"
                >
                  <Flag size={14} className="shrink-0 mt-0.5 text-primary" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium leading-tight truncate">{m.title}</span>
                    <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                      {formatDate(m.date)}
                      {personName ? ` · ${t('timeline.aboutPerson', { name: personName })}` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2 leading-snug">{t('home.relNotesEmpty')}</p>
        )}
      </section>
    </div>
  );
}