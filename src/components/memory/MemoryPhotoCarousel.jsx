import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import useSignedPhotoUrls from '@/hooks/useSignedPhotoUrls';
import { useI18n } from '@/lib/i18n/I18nContext';

// The pictures kept with one moment, as a swipeable strip: the photos sit in a
// scroll-snap track so one swipe moves one picture, and the dots jump straight
// to a picture. Renders nothing when the moment has no pictures.
export default function MemoryPhotoCarousel({ photos }) {
  const { t } = useI18n();
  const list = (photos || []).filter(Boolean);
  const key = list.join('|');
  const urls = useSignedPhotoUrls(list);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [key]);

  if (!list.length) return null;

  const jumpTo = (index) => {
    const el = trackRef.current;
    setActive(index);
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="mt-2">
      <div
        ref={trackRef}
        onScroll={() => {
          const el = trackRef.current;
          if (!el || !el.clientWidth) return;
          const index = Math.round(el.scrollLeft / el.clientWidth);
          if (index !== active) setActive(index);
        }}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory rounded-2xl border border-border"
      >
        {list.map((uri, i) => (
          <div key={`${uri}-${i}`} className="shrink-0 w-full snap-center aspect-[4/3] bg-secondary/40">
            {urls[uri] ? (
              // A plain <img>: these are signed private URLs, and their signature
              // travels in the query string, which the shared image component's
              // resize transform strips — so the URL has to be used verbatim.
              <img
                src={urls[uri]}
                alt={`${t('label.photo')} ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {list.length > 1 && (
        <div className="flex items-center justify-center mt-1 -mb-1">
          {list.map((uri, i) => (
            <button
              key={`dot-${uri}-${i}`}
              type="button"
              onClick={() => jumpTo(i)}
              aria-label={t('memory.showPhoto', { index: i + 1 })}
              aria-current={i === active}
              className="p-2"
            >
              <span
                className={`block w-1.5 h-1.5 rounded-full transition-colors ${i === active ? 'bg-primary' : 'bg-border'}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}