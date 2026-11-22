import React from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { purchaseUrlFor } from '@/lib/giftPurchase';
import { useI18n } from '@/lib/i18n/I18nContext';

// Common, reusable gift ideas — one tap adds a copy to the selected person's list.
const TEMPLATES = [
  { title: 'Flowers', category: 'Home & Self', emoji: '💐', note: 'A fresh bouquet.' },
  { title: 'Gift card', category: 'Other', emoji: '💳', note: 'A gift card — specify the store or type, e.g. Amazon, Target, or a favorite restaurant.', promptType: true },
  { title: 'Chocolates', category: 'Home & Self', emoji: '🍫', note: 'A box of gourmet chocolates.' },
  { title: 'Coffee / tea', category: 'Home & Self', emoji: '☕', note: 'Specialty coffee beans or loose-leaf tea.' },
  { title: 'Date night', category: 'Experiences', emoji: '🍽️', note: 'Dinner or an evening out together.' },
  { title: 'Spa day', category: 'Experiences', emoji: '🧖', note: 'A relaxing spa or massage session.' },
  { title: 'Jewelry', category: 'Jewelry', emoji: '💍', note: 'A piece of jewelry — e.g. a watch, necklace, bracelet, or earrings.' },
  { title: 'Bottle of wine', category: 'Home & Self', emoji: '🍷', note: 'A nice bottle of wine or champagne.' },
  { title: 'Concert tickets', category: 'Experiences', emoji: '🎫', note: 'Tickets to a show they would love.' },
  { title: 'Scented candle', category: 'Home & Self', emoji: '🕯️', note: 'A high-quality scented candle.' },
  { title: 'Other', category: 'Other', emoji: '➕', note: '', custom: true },
];

export default function GiftTemplates({ disabled, onAdd }) {
  const { t } = useI18n();
  const [added, setAdded] = React.useState(new Set());

  const handleTap = (tpl) => {
    let title = tpl.title;
    let note = tpl.note;
    if (tpl.custom) {
      const custom = window.prompt(t('giftTemplates.customPrompt'));
      if (!custom || !custom.trim()) return;
      title = custom.trim();
      note = '';
    } else if (tpl.promptType) {
      const specific = window.prompt(t('giftTemplates.storePrompt'));
      if (!specific || !specific.trim()) return;
      title = `${tpl.title} (${specific.trim()})`;
      note = `A ${specific.trim()} gift card.`;
    }
    onAdd({
      title,
      category: tpl.category,
      note,
      budget: null,
      link: '',
      targetDate: '',
      source: 'template',
    });
    setAdded((prev) => {
      const next = new Set(prev);
      next.add(tpl.title);
      return next;
    });
    // Clear the "Added" checkmark after a moment so it can be tapped again later.
    setTimeout(() => {
      setAdded((prev) => {
        if (!prev.has(tpl.title)) return prev;
        const next = new Set(prev);
        next.delete(tpl.title);
        return next;
      });
    }, 1400);
  };

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold">{t('giftTemplates.quickTemplates')}</h2>
        <span className="text-xs text-muted-foreground">{t('giftTemplates.tapToAdd')}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TEMPLATES.map((tpl) => {
          const isAdded = added.has(tpl.title);
          return (
            <div key={tpl.title} className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleTap(tpl)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 w-full rounded-xl border transition-colors ${
                  disabled
                    ? 'border-border bg-secondary/50 opacity-60'
                    : isAdded
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-secondary/60'
                }`}
                aria-label={t('giftTemplates.addAria', { title: tpl.title })}
              >
                <span className="text-lg leading-none">{tpl.emoji}</span>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${isAdded ? 'text-primary' : ''}`}>
                  {isAdded ? (
                    <>
                      <Check size={12} /> {t('giftTemplates.added')}
                    </>
                  ) : (
                    tpl.title
                  )}
                </span>
              </button>
              {!isAdded && !tpl.custom && (
                <a
                  href={purchaseUrlFor({ title: tpl.title })}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary"
                  aria-label={t('giftTemplates.searchAria', { title: tpl.title })}
                >
                  <ShoppingBag size={9} /> {t('giftTemplates.find')}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}