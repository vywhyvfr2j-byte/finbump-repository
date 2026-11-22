import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import useSignedPhotoUrls from '@/hooks/useSignedPhotoUrls';
import YearPhotoViewer from '@/components/memory/year/YearPhotoViewer';
import { useI18n } from '@/lib/i18n/I18nContext';

// The pictures kept through the year, gathered ahead of the month-by-month
// scroll. Tapping one opens it full size, with the set it came from to step
// through. Renders nothing when the year holds no pictures.
export default function YearPhotoStrip({ photos }) {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState(-1);
  const list = (photos || []).filter((photo) => photo.uri);
  const urls = useSignedPhotoUrls(list.map((photo) => photo.uri));

  if (!list.length) return null;

  return (
    <section className="mt-4" aria-label={t('memorySummary.photosAria')}>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {list.map((photo, index) => (
          <button
            key={`${photo.uri}-${index}`}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={t('memory.showPhoto', { index: index + 1 })}
            className="shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden border border-border bg-secondary/40"
          >
            {urls[photo.uri] ? (
              // A plain <img>: these are signed private URLs and the signature
              // travels in the query string, which the shared image component's
              // resize transform strips — so the URL has to be used verbatim.
              <img src={urls[photo.uri]} alt="" loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center">
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              </span>
            )}
          </button>
        ))}
      </div>

      <YearPhotoViewer
        photos={list}
        urls={urls}
        index={openIndex}
        onClose={() => setOpenIndex(-1)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}