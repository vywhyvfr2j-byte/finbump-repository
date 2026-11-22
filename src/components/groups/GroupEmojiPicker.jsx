import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { GROUP_EMOJIS } from '@/lib/groupConstants';
import { useI18n } from '@/lib/i18n/I18nContext';

// The group's icon is one emoji, chosen by tapping it. It is the group's face
// everywhere it shows up, so the choice opens in a full sheet rather than a
// cramped strip of a dozen options.
export default function GroupEmojiPicker({ value, onChange, label }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const pick = (emoji) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left"
        aria-label={t('groups.pickEmoji')}
      >
        <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl leading-none shrink-0">
          {value || '👥'}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-xs text-muted-foreground">{t('groups.tapToChange')}</span>
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t('groups.pickEmoji')}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-7 gap-1.5 mt-2">
            {GROUP_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => pick(emoji)}
                className={`h-10 rounded-xl text-xl flex items-center justify-center border transition-colors ${value === emoji ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/60'}`}
                aria-label={emoji}
                aria-pressed={value === emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}