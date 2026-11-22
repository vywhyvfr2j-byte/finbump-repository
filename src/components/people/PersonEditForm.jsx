import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RELATIONS } from '@/lib/peopleConstants';
import { base44 } from '@/api/base44Client';
import { Camera, Loader2 } from 'lucide-react';

export default function PersonEditForm({ draft, setDraft, onSave, onCancel }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    setDraft((d) => ({ ...d, photoUrl: file_url }));
    setUploading(false);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-16 h-16 rounded-full"
        >
          {draft.photoUrl ? (
            <img src={draft.photoUrl} alt={draft.name} loading="lazy" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-display text-xl font-semibold">
              {(draft.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>
      <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Name" className="h-11" />
      <Input value={draft.preferredName || ''} onChange={(e) => setDraft((d) => ({ ...d, preferredName: e.target.value }))} placeholder="Preferred name (optional)" className="h-11" />
      <Select value={draft.relation} onValueChange={(v) => setDraft((d) => ({ ...d, relation: v }))}>
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RELATIONS.map((r) => (
            <SelectItem key={r.key} value={r.key}>
              {r.emoji} {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground pl-1">🎂 Birthday</label>
        <Input type="date" value={draft.birthday || ''} onChange={(e) => setDraft((d) => ({ ...d, birthday: e.target.value }))} className="h-11" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground pl-1">💍 Anniversary</label>
        <Input type="date" value={draft.anniversary || ''} onChange={(e) => setDraft((d) => ({ ...d, anniversary: e.target.value }))} className="h-11" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground pl-1">📍 Home zip code</label>
        <Input value={draft.zipCode || ''} onChange={(e) => setDraft((d) => ({ ...d, zipCode: e.target.value }))} placeholder="e.g. 60601" className="h-11" />
      </div>
      <Textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="Notes (sizes, likes, etc.)" className="min-h-[70px]" />
      <div className="flex gap-2">
        <Button onClick={onSave} className="flex-1 h-10">Save</Button>
        <Button onClick={onCancel} variant="outline" className="flex-1 h-10">Cancel</Button>
      </div>
    </div>
  );
}