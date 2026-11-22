import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Bookmark, MapPin } from 'lucide-react';

// One button that opens the saved gatherings and drops the chosen one's food
// type, budget and restaurant straight into the new-meal form.
export default function QuickLoadTemplateSheet({ templates = [], onApply }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const load = (tpl) => {
    onApply?.(tpl);
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" className="h-11 w-full" onClick={() => setOpen(true)}>
        <Bookmark size={15} /> {t('meal.quickLoad')}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-left">
              <Bookmark size={17} /> {t('meal.quickLoad')}
            </SheetTitle>
            <SheetDescription className="text-left">{t('meal.quickLoadDesc')}</SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-3 pb-6">
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('meal.noTemplates')}</p>
            )}

            {templates.map((tpl) => (
              <div key={tpl.id} className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
                <p className="font-medium leading-tight">{tpl.name}</p>

                {tpl.venueName && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    <span>{[tpl.venueName, tpl.venueAddress].filter(Boolean).join(' · ')}</span>
                  </p>
                )}

                {(tpl.cuisine || tpl.budget) && (
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.cuisine && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{tpl.cuisine}</span>
                    )}
                    {tpl.budget && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{tpl.budget}</span>
                    )}
                  </div>
                )}

                <Button variant="outline" className="h-10 w-full" onClick={() => load(tpl)}>
                  {t('meal.quickLoadUse')}
                </Button>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}