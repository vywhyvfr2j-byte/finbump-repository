import React, { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useSignedPhotoUrls from '@/hooks/useSignedPhotoUrls';
import { useI18n } from '@/lib/i18n/I18nContext';

// Attach pictures to a memory moment. They're uploaded to private storage (no
// public link), so the thumbnails are shown through signed URLs.
export default function MemoryPhotoPicker({ photos, onChange }) {
  const { t } = useI18n();
  const list = (photos || []).filter(Boolean);
  const urls = useSignedPhotoUrls(list);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        if (file_uri) uploaded.push(file_uri);
      }
      if (uploaded.length) onChange([...list, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-label={t('memory.addPhotos')}
        onChange={handleFiles}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
        {uploading ? t('memory.photoUploading') : t('memory.addPhotos')}
      </button>

      {list.map((uri, i) => (
        <span key={`${uri}-${i}`} className="relative w-12 h-12 rounded-xl overflow-hidden border border-border shrink-0">
          {urls[uri] ? (
            // Signed private URL — used verbatim (its signature lives in the
            // query string, which the shared image component's transform drops).
            <img
              src={urls[uri]}
              alt={`${t('label.photo')} ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="block w-full h-full bg-secondary/50" />
          )}
          <button
            type="button"
            onClick={() => onChange(list.filter((_, idx) => idx !== i))}
            aria-label={t('memory.removePhoto')}
            className="ks-hit absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/55 text-white flex items-center justify-center"
          >
            <X size={10} />
          </button>
        </span>
      ))}
    </div>
  );
}