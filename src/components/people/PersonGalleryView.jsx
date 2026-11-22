import React, { useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Image } from '@/components/ui/image';
import EmptyState from '@/components/EmptyState';
import PhotoLightbox from '@/components/people/PhotoLightbox';
import { useI18n } from '@/lib/i18n/I18nContext';

// Browses every photo saved on the user's contacts: all of them in one grid, or
// narrowed to a single contact, with a tap opening the photo large. Each
// contact's primary photo leads, then their saved gallery.
export default function PersonGalleryView() {
  const { t } = useI18n();
  const { people } = useKeepsake();
  const [filterId, setFilterId] = useState('all');
  const [openIndex, setOpenIndex] = useState(-1);

  const entries = useMemo(() => {
    const out = [];
    people.forEach((p) => {
      const urls = [...new Set([p.photoUrl, ...(p.photos || [])].filter(Boolean))];
      urls.forEach((url) => out.push({ url, personId: p.id, personName: p.preferredName || p.name }));
    });
    return out;
  }, [people]);

  const contacts = people.filter((p) => p.photoUrl || (p.photos || []).length);
  const activeId = contacts.some((c) => c.id === filterId) ? filterId : 'all';
  const shown = activeId === 'all' ? entries : entries.filter((e) => e.personId === activeId);
  const activeContact = people.find((p) => p.id === activeId);

  const select = (id) => {
    setFilterId(id);
    setOpenIndex(-1);
  };

  if (!entries.length) {
    return <EmptyState icon={Camera} title={t('people.noPhotos')} subtitle={t('people.noPhotosDesc')} />;
  }

  const chipClass = (active) =>
    `shrink-0 h-9 px-3.5 rounded-full text-sm font-medium border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground'}`;

  return (
    <div className="space-y-3">
      {/* Contact picker — everyone with photos, or all of them together. */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-0.5">
        <button type="button" onClick={() => select('all')} className={chipClass(activeId === 'all')}>
          {t('people.all')}
        </button>
        {contacts.map((c) => (
          <button key={c.id} type="button" onClick={() => select(c.id)} className={chipClass(activeId === c.id)}>
            {c.preferredName || c.name}
          </button>
        ))}
      </div>

      {activeContact && (
        <p className="text-xs font-medium text-muted-foreground pl-1">
          {t('people.photoCount', { count: shown.length })}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {shown.map((e, i) => (
          <button
            key={`${e.personId}-${e.url}`}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative aspect-square rounded-xl overflow-hidden border border-border"
            aria-label={`${e.personName} — ${t('label.photo')} ${i + 1}`}
          >
            <Image src={e.url} fittingType="fill" alt={e.personName} className="w-full h-full" />
            {activeId === 'all' && (
              <span className="absolute inset-x-0 bottom-0 px-1.5 pt-3 pb-1 text-[10px] font-medium text-white text-left truncate bg-gradient-to-t from-black/75 via-black/40 to-transparent">
                {e.personName}
              </span>
            )}
          </button>
        ))}
      </div>

      <PhotoLightbox
        items={shown}
        index={openIndex}
        onClose={() => setOpenIndex(-1)}
        onNavigate={setOpenIndex}
      />
    </div>
  );
}