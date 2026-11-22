import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Post-send reminder: once the e-card is on its way, gently ask whether the
// user also wants to send a gift or gift card. "Yes" hands off to the gift
// tracker for that person; declining (button, X, or Escape) just closes out.
export default function SendGiftPromptDialog({ open, name, onYes, onNo }) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onNo(); }}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{t('cardBuilder.giftPromptTitle')}</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {t('cardBuilder.giftPromptBody', { name })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-1">
          <Button onClick={onYes} className="w-full h-12 rounded-2xl gap-2">
            <Gift size={16} />
            {t('cardBuilder.giftPromptYes')}
          </Button>
          <Button onClick={onNo} variant="outline" className="w-full h-12 rounded-2xl">
            {t('cardBuilder.giftPromptNo')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}