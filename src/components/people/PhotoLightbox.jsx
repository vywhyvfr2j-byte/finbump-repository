import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Full-size viewer for a contact's photo, stepping through the set the user was
// browsing (the filtered gallery they tapped from).
export default function PhotoLightbox({ items, index, onClose, onNavigate }) {
  const { t } = useI18n();
  const open = index >= 0 && index < items.length;
  const item = open ? items[index] : null;
  const step = (delta) => onNavigate((index + delta + items.length) % items.length);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-[520px] p-3">
        {item && (
          <div className="space-y-2.5">
            <DialogTitle className="text-sm font-medium truncate pr-6">{item.personName}</DialogTitle>
            <DialogDescription className="sr-only">{t('people.photoViewerHint')}</DialogDescription>
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-secondary/50">
              <Image src={item.url} fittingType="fit" alt={item.personName} className="w-full h-full" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{index + 1} / {items.length}</span>
              {items.length > 1 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => step(-1)} aria-label={t('people.prevPhoto')}>
                    <ChevronLeft size={15} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => step(1)} aria-label={t('people.nextPhoto')}>
                    <ChevronRight size={15} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}