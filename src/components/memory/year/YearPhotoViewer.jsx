import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { parseMemoryDay } from '@/lib/memoryDates';
import { useI18n } from '@/lib/i18n/I18nContext';

// Full-size look at one of the year's pictures, titled by the day it was kept,
// with the rest of the set to step through.
export default function YearPhotoViewer({ photos, urls, index, onClose, onNavigate }) {
  const { t, language } = useI18n();
  const list = photos || [];
  const photo = index >= 0 && index < list.length ? list[index] : null;
  const step = (delta) => onNavigate((index + delta + list.length) % list.length);

  return (
    <Dialog open={Boolean(photo)} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-[520px] p-3">
        {photo && (
          <div className="space-y-2.5">
            <DialogTitle className="text-sm font-medium pr-6">
              {parseMemoryDay(photo.at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </DialogTitle>
            <DialogDescription className="sr-only">{t('memorySummary.photoViewerHint')}</DialogDescription>

            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-secondary/50">
              {urls[photo.uri] ? (
                // Plain <img>: a signed private URL must be used verbatim, since
                // the shared image component's transform strips its signature.
                <img src={urls[photo.uri]} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{index + 1} / {list.length}</span>
              {list.length > 1 && (
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