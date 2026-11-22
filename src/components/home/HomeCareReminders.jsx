import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareReminders, careItemKey } from '@/hooks/useCareReminders';
import { HandHeart, Heart, Clock, Check, X, Sparkles, Mail } from 'lucide-react';
import CareCardPicker from '@/components/care/CareCardPicker';
import { cardBuilderLink, CARE_OCCASION } from '@/lib/cardBuilderLink';
import { useI18n } from '@/lib/i18n/I18nContext';

// Due/overdue prayer and health check-in reminders with inline quick-complete
// and snooze buttons, so the user can log a check-in or pause a reminder for
// 24 hours from the Home dashboard without opening the full Care & Prayer page.
// A multi-select mode lets the user snooze several reminders at once.
export default function HomeCareReminders() {
  const items = useCareReminders();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [selected, setSelected] = useState(() => new Set());
  const [cardPicker, setCardPicker] = useState(null);

  // Drop selection keys that no longer correspond to a due item
  const validKeys = useMemo(() => new Set(items.map(careItemKey)), [items]);
  const selectedKeys = useMemo(
    () => [...selected].filter((k) => validKeys.has(k)),
    [selected, validKeys]
  );
  const allSelected = items.length > 0 && selectedKeys.length === items.length;

  const toggleItem = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(items.map(careItemKey)));

  const clearSelection = () => setSelected(new Set());

  const bulkSnooze = () => {
    const target = new Set(selectedKeys);
    items.forEach((item) => {
      if (target.has(careItemKey(item))) item.onSnooze();
    });
    clearSelection();
  };

  if (items.length === 0) return null;

  return (
    <div className="px-5 mt-6">
      <div className="rounded-2xl border px-4 py-4 shadow-card ks-card-tint">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">{t('home.careReminders')}</h2>
          <div className="flex items-center gap-3">
            {items.length > 1 && (
              <button onClick={toggleAll} className="inline-flex items-center min-h-[44px] -my-2.5 text-xs font-medium text-primary">
                {allSelected ? t('home.clearAll') : t('home.selectAll')}
              </button>
            )}
            <button onClick={() => navigate('/prayer')} className="inline-flex items-center min-h-[44px] -my-2.5 text-xs font-medium text-primary">
              {t('home.viewAll')}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {items.map((item) => {
            const key = careItemKey(item);
            const isSelected = selected.has(key);
            return (
              <div
                key={key}
                className={`rounded-2xl border bg-primary/5 p-3.5 flex flex-col gap-2.5 transition-colors ${
                  isSelected ? 'border-primary' : 'border-primary/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => toggleItem(key)}
                    aria-label={isSelected ? t('home.deselectName', { name: item.name }) : t('home.selectName', { name: item.name })}
                    className={`relative ks-hit flex items-center justify-center w-7 h-7 rounded-full border shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-primary/30 text-transparent'
                    }`}
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => navigate('/prayer')}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary shrink-0">
                      {item.icon === 'prayer' ? <HandHeart size={16} /> : <Heart size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.label} · {item.days === null ? t('time.never') : item.days === 0 ? t('home.today') : t('time.daysAgo', { days: item.days })}
                      </p>
                    </div>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => navigate(cardBuilderLink({
                      personId: item.id,
                      personName: item.contactName,
                      occasion: CARE_OCCASION[item.icon],
                    }))}
                    title={t('home.sendCardToName', { name: item.contactName || item.name })}
                    aria-label={t('home.sendCardToName', { name: item.contactName || item.name })}
                    className="flex items-center justify-center w-11 h-11 -m-1 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Mail size={16} />
                  </button>
                  <button
                    onClick={() => setCardPicker(item)}
                    title={item.cardDay ? t('home.cardReady') : t('home.writeCard')}
                    aria-label={t('home.sendCardToName', { name: item.name })}
                    className={`flex items-center justify-center w-11 h-11 -m-1 rounded-xl border transition-colors ${
                      item.cardDay
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-primary/30 text-primary hover:bg-primary/10'
                    }`}
                  >
                    <Sparkles size={16} />
                  </button>
                  <button
                    onClick={item.onSnooze}
                    title={t('home.snooze24Hours')}
                    aria-label={t('home.snoozeLabelAria', { label: item.label })}
                    className="flex items-center justify-center w-11 h-11 -m-1 rounded-xl border border-primary/30 text-primary transition-colors hover:bg-primary/10"
                  >
                    <Clock size={16} />
                  </button>
                  <button
                    onClick={item.onComplete}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
                  >
                    {item.icon === 'prayer' ? <HandHeart size={15} /> : <Heart size={15} />}
                    {item.icon === 'prayer' ? t('home.prayed') : t('home.checkedIn')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {selectedKeys.length > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-primary bg-card shadow-md p-3 px-4">
            <span className="text-sm font-medium">{t('home.countSelected', { count: selectedKeys.length })}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="flex items-center justify-center w-11 h-11 rounded-xl border border-primary/30 text-primary"
                aria-label={t('home.clearSelection')}
              >
                <X size={16} />
              </button>
              <button
                onClick={bulkSnooze}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                <Clock size={15} />
                {t('home.snoozeSelected')}
              </button>
            </div>
          </div>
        )}
      </div>

      <CareCardPicker
        open={!!cardPicker}
        onOpenChange={(o) => { if (!o) setCardPicker(null); }}
        careType={cardPicker?.icon === 'prayer' ? 'prayer' : 'health'}
        name={cardPicker?.name}
        relation={cardPicker?.relation}
        notes={cardPicker?.notes}
        likes={cardPicker?.likes}
      />
    </div>
  );
}