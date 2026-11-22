import React, { useEffect, useRef, useState } from 'react';
import VoiceInputButton from '@/components/memory/VoiceInputButton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Rename or rewrite a saved support message. This is also the step where a new
// one is given its name, so a chip can read "Thinking of you" instead of the
// whole message.
export default function MessageTemplateEditor({ open, template, onClose, onSave, onDelete }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const isExisting = !!template?.id;
  const voiceBaseRef = useRef('');

  useEffect(() => {
    if (!open) return;
    setTitle(template?.title || '');
    setBody(template?.text || '');
  }, [open, template]);

  const handleSave = () => {
    if (!body.trim()) return;
    onSave({ title: title.trim(), text: body.trim() });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-w-[440px] mx-auto rounded-t-2xl p-5">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-base">
            {isExisting ? t('home.messageTemplate.editTitle') : t('home.messageTemplate.newTitle')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('home.messageTemplate.name')}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('home.messageTemplate.nameHint')}
              maxLength={60}
              className="h-12"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('home.messageTemplate.message')}</label>
            {/* Dictate instead of typing: the spoken words land in the box,
                added to whatever is already written there. */}
            <div className="flex items-start gap-2">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="resize-none flex-1" />
              <VoiceInputButton
                onStart={() => { voiceBaseRef.current = (body || '').trim(); }}
                onTranscript={(spoken) => setBody([voiceBaseRef.current, spoken].filter(Boolean).join(' ').trim())}
                startLabel={t('home.voiceStart')}
                stopLabel={t('home.voiceStop')}
                listeningLabel={t('home.voiceListening')}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="mt-5 flex-col gap-2 sm:flex-col">
          <Button onClick={handleSave} disabled={!body.trim()} className="w-full h-12 rounded-2xl">
            {t('common.save')}
          </Button>
          {isExisting && (
            <Button
              variant="outline"
              onClick={() => onDelete(template)}
              className="w-full h-12 rounded-2xl text-destructive border-destructive/30"
            >
              <Trash2 size={16} className="mr-1.5" /> {t('home.messageTemplate.remove')}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}