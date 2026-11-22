import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import VoiceInputButton from '@/components/memory/VoiceInputButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/I18nContext';

// The confirmation step for a saved support message: the message is shown again,
// still editable, and nothing is delivered until Send it is pressed. Delivery is
// app-to-app (the same path cards use), so it reaches contacts who are FinBump users.
export default function SendMessageDialog({ open, onClose, personId, personName, message }) {
  const [text, setText] = useState(message);
  const [sending, setSending] = useState(false);
  const voiceBaseRef = useRef('');
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (open) setText(message);
  }, [open, message]);

  const handleSend = async () => {
    if (!text.trim() || !personId) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('send-card', {
        personId,
        occasion: 'thinking',
        message: text.trim(),
      });
      const data = res?.data || {};
      const name = data.recipientName || personName || 'them';
      if (data.delivery === 'app') {
        toast({ title: t('cardBuilder.cardSent', { name }), description: t('cardBuilder.sentDesc') });
      } else {
        toast({ title: t('cardBuilder.notUser', { name }), description: t('cardBuilder.notUserDesc') });
      }
      onClose();
    } catch (e) {
      toast({ title: t('cardBuilder.couldNotSend'), description: e?.message });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[420px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">{t('home.sendMessageTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-3.5 py-2.5 text-sm">
            <span className="text-muted-foreground">{t('home.sendMessageTo')}</span>
            <span className="font-medium truncate">{personName}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('home.sendMessageBody')}</label>
            {/* Dictate instead of typing: the spoken words land in the box,
                added to whatever is already written there. */}
            <div className="flex items-start gap-2">
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="resize-none flex-1" />
              <VoiceInputButton
                onStart={() => { voiceBaseRef.current = (text || '').trim(); }}
                onTranscript={(spoken) => setText([voiceBaseRef.current, spoken].filter(Boolean).join(' ').trim())}
                startLabel={t('home.voiceStart')}
                stopLabel={t('home.voiceStop')}
                listeningLabel={t('home.voiceListening')}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          <Button onClick={handleSend} disabled={sending || !text.trim()} className="w-full h-11 rounded-2xl">
            {sending ? <Loader2 className="animate-spin" size={16} /> : t('home.sendMessageConfirm')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full h-11 rounded-2xl">
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}