import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Sparkles, Gift, ChevronRight } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useI18n } from '@/lib/i18n/I18nContext';

// "Send a gift" for a birthday or anniversary: a small chooser that drops the
// user into the app's AI gift-purchase areas already scoped to the person the
// occasion belongs to — the AI Gift Finder (AI ideas with buy links, budgets and
// tracking) and the per-person gift ideas page.
//
// A pet's occasion uses the pet's owner, the same way the pet profile links into
// the Gift tracker; pets have no gift ideas page of their own, so they get the
// AI Gift Finder only.
export default function OccasionGiftSheet({ occasion, open, onOpenChange }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { people } = useKeepsake();
  const isPet = occasion?.relation === 'pet';
  const owner = isPet ? (people || []).find((p) => p.id === occasion?.ownerId) : null;
  const giftOwnerId = isPet ? owner?.id : occasion?.personId;
  const giftOwnerName = isPet ? owner?.name : occasion?.name;
  const personName = occasion?.name || '';

  const trackerParams = new URLSearchParams();
  if (giftOwnerName) trackerParams.set('person', giftOwnerName);
  if (isPet && occasion?.personId) trackerParams.set('pet', occasion.personId);
  const trackerQs = trackerParams.toString();

  const options = [
    {
      key: 'finder',
      icon: Sparkles,
      title: t('occasions.giftFinderTitle'),
      desc: t('occasions.giftFinderDesc'),
      to: trackerQs ? `/gift-tracker?${trackerQs}` : '/gift-tracker',
    },
    !isPet && {
      key: 'ideas',
      icon: Gift,
      title: t('occasions.giftIdeasTitle', { name: personName }),
      desc: t('occasions.giftIdeasDesc'),
      to: giftOwnerId ? `/ideas?person=${giftOwnerId}&tab=gifts` : '/ideas',
    },
  ].filter(Boolean);

  const open_ = (to) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-2 text-left">
          <SheetTitle className="font-display text-lg">
            {t('occasions.giftSheetTitle', { name: personName })}
          </SheetTitle>
          <SheetDescription>{t('occasions.giftSheetDesc')}</SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-6 space-y-2.5">
          {options.map(({ key, icon: Icon, title, desc, to }) => (
            <button
              key={key}
              type="button"
              onClick={() => open_(to)}
              className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:bg-secondary/60 transition-colors active:scale-[0.98]"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <Icon size={20} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate">{title}</span>
                <span className="block text-xs text-muted-foreground leading-tight mt-0.5">{desc}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}