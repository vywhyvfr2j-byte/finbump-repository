import React, { useRef, useState } from 'react';
import { Image } from '@/components/ui/image';
import { Camera, Loader2, X, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Simple photo gallery: uploads images to public storage and displays them in
// a responsive grid. `photos` is an array of public URLs; `onChange` receives
// the new full array so the parent can persist it on its entity.
export default function PhotoGallery({ photos, onChange, title = 'Photos' }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const list = Array.isArray(photos) ? photos.filter(Boolean) : [];

  const handleFiles = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        if (file_url) uploaded.push(file_url);
      }
      if (uploaded.length) onChange([...list, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = (idx) => onChange(list.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{title}</label>
        {list.length > 0 && <span className="text-[11px] text-muted-foreground">{list.length}</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {list.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
            <Image src={url} fittingType="fill" alt={`Photo ${idx + 1}`} className="w-full h-full" />
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100 transition-opacity after:content-[''] after:absolute after:-inset-2"
              aria-label="Remove photo"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        {list.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="col-span-3 aspect-[3/1] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={20} />}
            <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Add a photo'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            aria-label="Add photo"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
          </button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple aria-label="Upload photos" className="hidden" onChange={handleFiles} />
    </div>
  );
}