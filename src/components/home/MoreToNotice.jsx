import React, { useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// One quiet row that holds everything that used to stack on Home — the upcoming
// occasion countdown, stale-act notices, care reminders, drift alerts, card
// prompts and suggestions. Nothing inside changes: it simply waits behind one
// tap instead of competing with the Today list for attention.
export default function MoreToNotice({ children }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <div className="px-5">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card text-left"
        >
          <span className="flex items-center gap-2">
            <Bell size={15} className="text-primary" />
            <span className="text-sm font-medium">{t('moreToNotice.title')}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {open ? t('moreToNotice.hide') : t('moreToNotice.show')}
            <ChevronDown size={15} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </span>
        </button>
      </div>
      {/* Three notices at most: everything past the third waits for the ones
          above it to clear, so this never becomes the stack of banners it
          replaced. Children render nothing when they have nothing to say, and
          a null child produces no element — so the cap counts real notices. */}
      {open && <div className="[&>*:nth-child(n+4)]:!hidden">{children}</div>}
    </div>
  );
}