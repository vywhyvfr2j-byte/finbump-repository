import React, { useState } from 'react';
import { Image } from '@/components/ui/image';
import PhotoLightbox from '@/components/people/PhotoLightbox';
import { useI18n } from '@/lib/i18n/I18nContext';

// The pictures saved on a person's profile, gathered beside their year. These
// were uploaded to public storage, so they render straight from their URL and
// step through in the same viewer the photo gallery uses.
export default function YearGalleryStrip({ photos }) {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState(-1);
  const list = (photos || []).filter((photo) => photo.url);

  if (!list.length) return null;

  return (
    <section className="mt-5" aria-label={t('memorySummary.galleryAria')}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {t('memorySummary.galleryTitle')}
      </p>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {list.map((photo, index) => (
          <button
            key={`${photo.url}-${index}`}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={t('memory.showPhoto', { index: index + 1 })}
            className="shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden border border-border bg-secondary/40"
          >
            <Image src={photo.url} fittingType="fill" alt="" className="w-full h-full" />
          </button>
        ))}
      </div>

      <PhotoLightbox
        items={list}
        index={openIndex}
        onClose={() => setOpenIndex(-1)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}