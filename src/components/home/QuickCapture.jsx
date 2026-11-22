import React, { useRef, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import VoiceInputButton from '@/components/memory/VoiceInputButton';
import PrivacyHint from '@/components/PrivacyHint';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/I18nContext';

// One-tap capture from Home: a floating "+" opens a single field (type or
// dictate) that auto-saves as a PersonalNote with no category screen. The
// whole point is to remove the "choose fields" step where most entries die.
export default function QuickCapture() {
  const { language } = useI18n();
  const { addPersonalNote } = useKeepsake();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const voiceBaseRef = useRef('');

  const placeholder = language === 'es'
    ? 'Anota un pensamiento, un recuerdo o algo que acabas de hacer…'
    : 'Jot a thought, a moment, or something you just did…';
  const title = language === 'es' ? 'Captura rápida' : 'Quick capture';
  const desc = language === 'es'
    ? 'Se guarda como nota. Solo tú la verás.'
    : 'Saves as a note. Only you will see it.';
  const saved = language === 'es' ? 'Nota guardada' : 'Note saved';
  const saveLabel = language === 'es' ? 'Guardar' : 'Save';
  const ariaLabel = language === 'es' ? 'Captura rápida' : 'Quick capture';

  const handleSave = () => {
    const v = text.trim();
    if (!v) return;
    addPersonalNote(v, 'general', null);
    setText('');
    setOpen(false);
    toast({ title: saved, duration: 2500 });
  };

  return (
    <>
      {/* Inline labeled trigger, placed in the page flow by its parent so it
          never floats over other features. The label + subtitle make its
          purpose obvious instead of an unlabeled dot. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        className="w-full flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-foreground shadow-card hover:bg-secondary/40 transition-colors"
      >
        <span className="flex items-center justify-center w-9 h-9 mt-0.5 rounded-full bg-primary text-primary-foreground shrink-0">
          <Plus size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold leading-snug text-foreground">{title}</span>
          <span className="block text-xs text-muted-foreground leading-snug whitespace-normal">{desc}</span>
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-w-[440px] left-1/2 right-auto -translate-x-1/2 rounded-t-2xl p-5 pb-8"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{desc}</SheetDescription>
          </SheetHeader>

          <div className="mt-3">
            <PrivacyHint className="mb-1.5" />
          </div>

          <div className="flex items-start gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="flex-1 min-h-[140px] resize-none rounded-xl border-2 border-border bg-card px-4 py-3 text-[17px] leading-relaxed font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground"
              autoFocus
            />
            <VoiceInputButton
              onStart={() => { voiceBaseRef.current = (text || '').trim(); }}
              onTranscript={(spoken) => setText([voiceBaseRef.current, spoken].filter(Boolean).join(' ').trim())}
              startLabel={language === 'es' ? 'Dictar' : 'Say it'}
              stopLabel={language === 'es' ? 'Detener' : 'Stop'}
              listeningLabel={language === 'es' ? 'Escuchando…' : 'Listening…'}
            />
          </div>

          <Button onClick={handleSave} disabled={!text.trim()} className="w-full h-11 rounded-xl mt-4">
            <Check size={16} /> {saveLabel}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}