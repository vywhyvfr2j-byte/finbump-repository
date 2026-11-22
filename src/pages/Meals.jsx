import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useToast } from '@/components/ui/use-toast';
import TopNav from '@/components/TopNav';
import MealCard from '@/components/meals/MealCard';
import MealCreateForm from '@/components/meals/MealCreateForm';
import MealTemplatesPanel from '@/components/meals/MealTemplatesPanel';
import EmptyState from '@/components/EmptyState';
import PageSkeleton from '@/components/PageSkeleton';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Plus, X } from 'lucide-react';

export default function Meals() {
  useFeatureTracking('meals');
  const { t } = useI18n();
  const { people } = useKeepsake();
  const { toast } = useToast();

  const [meals, setMeals] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      base44.entities.Meal.list('-created_date'),
      base44.entities.MealTemplate.list('-created_date'),
    ])
      .then(([rows, saved]) => { if (!cancelled) { setMeals(rows || []); setTemplates(saved || []); } })
      .catch(() => { if (!cancelled) { setMeals([]); setTemplates([]); } });
    return () => { cancelled = true; };
  }, []);

  const handleCreated = (data) => {
    setMeals((prev) => [data.meal, ...(prev || [])]);
    setAdding(false);
    toast({
      title: t('meal.createdTitle'),
      description:
        data.inviteWarning ||
        t('meal.invitesOnTheWay', { count: data.inviteCount || 0 }),
    });
  };

  const handleTemplateSaved = (saved) => {
    setTemplates((prev) =>
      prev.some((tpl) => tpl.id === saved.id)
        ? prev.map((tpl) => (tpl.id === saved.id ? saved : tpl))
        : [saved, ...prev],
    );
  };

  const handleTemplateDeleted = (id) => {
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
  };

  if (meals === null) {
    return (
      <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto">
        <TopNav title={t('meal.title')} subtitle={t('meal.subtitle')} />
        <PageSkeleton />
      </div>
    );
  }

  const open = meals.filter((m) => m.status === 'proposed' || m.status === 'confirmed');
  const past = meals.filter((m) => m.status !== 'proposed' && m.status !== 'confirmed');

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={t('meal.title')}
        subtitle={t('meal.subtitle')}
        right={
          <div className="flex items-center gap-1.5">
            <Link
              to="/meals/dashboard"
              className="flex items-center justify-center w-11 h-11 rounded-full border border-border bg-card shrink-0"
              aria-label={t('meal.dashboard')}
            >
              <LayoutDashboard size={18} />
            </Link>
            <button
              onClick={() => setAdding((v) => !v)}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-sm shrink-0"
              aria-label={adding ? t('meal.closeAria') : t('meal.addAria')}
            >
            {adding ? <X size={22} style={{ stroke: 'currentColor' }} /> : <Plus size={22} style={{ stroke: 'currentColor' }} />}
            </button>
          </div>
        }
      />

      <div className="px-5 mt-2 space-y-4">
        {adding && (
          <MealCreateForm
            people={people}
            templates={templates}
            onTemplateSaved={handleTemplateSaved}
            onCreated={handleCreated}
            onCancel={() => setAdding(false)}
          />
        )}

        <MealTemplatesPanel
          templates={templates}
          onSaved={handleTemplateSaved}
          onDeleted={handleTemplateDeleted}
        />

        {!adding && meals.length === 0 && (
          <EmptyState
            icon={Plus}
            title={t('meal.empty')}
            subtitle={t('meal.emptyDesc')}
          />
        )}

        {open.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('meal.upcoming')}
            </p>
            {open.map((m) => <MealCard key={m.id} meal={m} />)}
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('meal.past')}
            </p>
            {past.map((m) => <MealCard key={m.id} meal={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}