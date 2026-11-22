import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KsGiftBudget } from '@/components/icons/KsIcons';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { buildNameCount, giftMatchesPerson } from '@/lib/giftMatch';
import { OCCASIONS } from '@/lib/giftConstants';
import { useI18n } from '@/lib/i18n/I18nContext';

const normalize = (val) => {
  if (!val) return {};
  if (typeof val === 'number') return { Other: val };
  return val;
};
const totalOf = (val) => OCCASIONS.reduce((sum, o) => sum + (Number(normalize(val)[o]) || 0), 0);

const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function GiftSpendingSummary({ hideLink = false, onRowClick }) {
  const { t } = useI18n();
  const { giftIdeas, people, personBudgets } = useKeepsake();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [occasion, setOccasion] = useState('All');

  const rows = useMemo(() => {
    const sorted = sortPeopleForPicker(people);
    const nameCounts = buildNameCount(people);
    const occMatch = (g) =>
      occasion === 'All' ? true :
      occasion === 'Other' ? (!g.occasion || g.occasion === 'Other') :
      g.occasion === occasion;
    return sorted.map((p) => {
      const spent = giftIdeas
        .filter((g) => giftMatchesPerson(g, p, nameCounts) && (g.purchased || g.gifted) && occMatch(g))
        .reduce((sum, g) => sum + (g.actualCost ?? g.budget ?? 0), 0);
      const limit = occasion === 'All'
        ? totalOf(personBudgets[p.name])
        : Number(normalize(personBudgets[p.name])[occasion]) || 0;
      return { id: p.id, name: p.name, spent, limit };
    });
  }, [giftIdeas, people, personBudgets, occasion]);

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const totalLimit = rows.reduce((s, r) => s + r.limit, 0);

  // Active = has spending or a budget set; inactive = no gifts and no budget.
  const activeRows = rows.filter((r) => r.spent > 0 || r.limit > 0);
  const inactiveRows = rows.filter((r) => r.spent === 0 && r.limit === 0);
  const visibleRows = showAll ? rows : activeRows;

  if (rows.length === 0) return null;

  return (
    <div className="px-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <KsGiftBudget size={18} />
          {t('giftSpending.title')}
        </h2>
        {!hideLink && (
          <button onClick={() => navigate('/calendar')} className="text-xs font-medium text-primary">
            {t('giftSpending.viewTracker')}
          </button>
        )}
      </div>

      <div className="mb-3">
        <Select value={occasion} onValueChange={setOccasion}>
          <SelectTrigger className="h-9 w-full max-w-[220px]">
            <SelectValue placeholder={t('giftSpending.allOccasions')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('giftSpending.allOccasions')}</SelectItem>
            {OCCASIONS.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        {totalLimit > 0 && (
          <div className="flex items-end justify-between pb-2 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('giftSpending.totalSpent')}</p>
              <p className="font-display text-2xl font-semibold mt-0.5">${fmt(totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('giftSpending.budgetLeft')}</p>
              <p className={`font-display text-2xl font-semibold mt-0.5 ${totalLimit - totalSpent < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                ${fmt(Math.max(0, totalLimit - totalSpent))}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {visibleRows.map((r) => {
            const left = r.limit ? r.limit - r.spent : null;
            const ratio = r.limit ? Math.min(1, r.spent / r.limit) : 0;
            return (
              <button
                key={r.id}
                onClick={() => (onRowClick ? onRowClick(r) : navigate(`/gift-tracker?person=${encodeURIComponent(r.name)}`))}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('giftSpending.spent', { amount: fmt(r.spent) })}{r.limit > 0 ? ` ${t('giftSpending.of', { amount: fmt(r.limit) })}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.limit > 0 ? (
                    <>
                      <span className={`text-xs font-semibold ${left < 0 ? 'text-destructive' : left != null && left <= r.limit * 0.2 ? 'text-accent' : 'text-emerald-600'}`}>
                        {left < 0 ? t('giftSpending.over') : t('giftSpending.amountLeft', { amount: fmt(left) })}
                      </span>
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ratio >= 1 ? 'bg-destructive' : ratio >= 0.8 ? 'bg-accent' : 'bg-primary'}`}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{t('giftSpending.noBudget')}</span>
                  )}
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </button>
            );
          })}
          {inactiveRows.length > 0 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground pt-1"
            >
              {showAll ? t('giftSpending.showLess') : t('giftSpending.showAll', { count: inactiveRows.length })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}