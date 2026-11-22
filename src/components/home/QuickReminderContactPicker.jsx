import React from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import ResponsiveMenu from '@/components/ui/responsive-menu';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';

// Sentinel id for "someone who isn't a saved contact" — the reminder then keeps
// the typed name as plain text instead of quietly creating a contact.
export const OTHER_ID = '__other__';

// Contact picker for the Home quick-reminder sheet: tap to open the list of
// contacts (a bottom sheet on phones, a menu on wider screens), or write in a
// name that isn't saved yet.
export default function QuickReminderContactPicker({ people, value, onChange }) {
  const { t } = useI18n();
  const sorted = sortPeopleForPicker(people || []);
  const current = sorted.find((p) => p.id === value.personId) || null;
  const writingIn = value.personId === OTHER_ID;

  const initials = (name) => (name || '?').charAt(0).toUpperCase();

  return (
    <div className="relative">
      <ResponsiveMenu
        title={t('home.quickReminderWho')}
        contentClassName="w-[var(--radix-popover-trigger-width)] p-0"
        trigger={
          <button
            type="button"
            aria-label={t('home.quickReminderWho')}
            className="w-full h-12 rounded-xl border border-input bg-card pl-3 pr-2.5 flex items-center gap-2.5 text-left"
          >
            {current?.photoUrl ? (
              <Image src={current.photoUrl} alt={current.name} fittingType="fill" className="w-7 h-7 rounded-full shrink-0" />
            ) : (
              <span className="w-7 h-7 rounded-full ks-brand-gradient text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                {writingIn ? '+' : initials(current?.name)}
              </span>
            )}
            <span className="flex-1 min-w-0 text-sm truncate">
              {writingIn ? t('home.quickReminderOther') : (current ? (current.preferredName || current.name) : t('home.quickReminderPickWho'))}
            </span>
            <ChevronDown size={16} className="text-muted-foreground shrink-0" />
          </button>
        }
      >
        {(close) => (
          <div className="p-1.5">
            {sorted.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">{t('home.quickReminderNoContacts')}</p>
            )}
            {sorted.map((p) => {
              const isCurrent = value.personId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { close(); onChange({ personId: p.id, otherName: '' }); }}
                  className={`w-full min-h-12 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${isCurrent ? 'bg-primary/10' : 'hover:bg-secondary/60'}`}
                >
                  {p.photoUrl ? (
                    <Image src={p.photoUrl} alt={p.name} fittingType="fill" className="w-7 h-7 rounded-full shrink-0" />
                  ) : (
                    <span className="w-7 h-7 rounded-full ks-brand-gradient text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                      {initials(p.name)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{p.preferredName || p.name}</span>
                    {p.relation && <span className="block text-[11px] text-muted-foreground capitalize truncate">{p.relation}</span>}
                  </span>
                  {isCurrent && <Check size={15} className="text-primary shrink-0" />}
                </button>
              );
            })}
            <div className="h-px bg-border my-1" />
            <button
              type="button"
              onClick={() => { close(); onChange({ personId: OTHER_ID, otherName: value.otherName || '' }); }}
              className={`w-full min-h-12 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${writingIn ? 'bg-primary/10' : 'hover:bg-secondary/60'}`}
            >
              <span className="w-7 h-7 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0">
                <Plus size={15} />
              </span>
              <span className="text-sm font-medium">{t('home.quickReminderOther')}</span>
            </button>
          </div>
        )}
      </ResponsiveMenu>

      {writingIn && (
        <Input
          value={value.otherName || ''}
          onChange={(e) => onChange({ personId: OTHER_ID, otherName: e.target.value })}
          placeholder={t('home.quickReminderOtherPlaceholder')}
          aria-label={t('home.quickReminderOtherPlaceholder')}
          maxLength={60}
          autoFocus
          className="h-12 mt-2"
        />
      )}
    </div>
  );
}