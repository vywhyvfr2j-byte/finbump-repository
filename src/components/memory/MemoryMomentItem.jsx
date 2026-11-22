import React, { useState } from 'react';
import { Heart, Moon, PenLine, Pencil, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import MemoryPhotoCarousel from '@/components/memory/MemoryPhotoCarousel';
import MemoryPhotoPicker from '@/components/memory/MemoryPhotoPicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate, relativeLast } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';

// One saved memory moment: the words, plus Edit (in place) and Delete (behind
// a confirmation warning, since removing a moment can't be undone).
export default function MemoryMomentItem({ entry, onSave, onDelete }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.text);
  const [draftPhotos, setDraftPhotos] = useState(entry.photos || []);
  const [confirming, setConfirming] = useState(false);

  // An evening moment, an appreciation or a plain note — each keeps its own
  // mark, so a reflection that mixes them still reads straight.
  const kind = entry.type === 'appreciation'
    ? { Icon: Heart, labelKey: 'timeline.appreciationTag' }
    : entry.type === 'memory'
      ? { Icon: Moon, labelKey: 'timeline.memoryTag' }
      : { Icon: PenLine, labelKey: 'timeline.noteTag' };
  const KindIcon = kind.Icon;

  const save = () => {
    const trimmed = draft.trim();
    const photosChanged = draftPhotos.join('|') !== (entry.photos || []).join('|');
    if (!trimmed || (trimmed === entry.text && !photosChanged)) {
      setEditing(false);
      return;
    }
    onSave(entry.id, { text: trimmed, photos: draftPhotos });
    setEditing(false);
  };

  return (
    <li className="relative pl-8">
      <span className="absolute left-0 top-0.5 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-background bg-accent/40 text-accent-foreground">
        <KindIcon size={13} />
      </span>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-muted-foreground">{formatDate(entry.at)}</span>
        <span className="text-[11px] text-muted-foreground">· {relativeLast(entry.at)}</span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/40 text-accent-foreground">
          {t(kind.labelKey)}
        </span>
      </div>

      {editing ? (
        <div className="mt-1.5">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            aria-label={t('memory.answerAria')}
            className="bg-card/60"
          />
          <div className="mt-2.5">
            <MemoryPhotoPicker photos={draftPhotos} onChange={setDraftPhotos} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button size="sm" onClick={save} disabled={!draft.trim()}>
              {t('memory.editSave')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(entry.text);
                setDraftPhotos(entry.photos || []);
                setEditing(false);
              }}
            >
              {t('memory.editCancel')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1">{entry.text}</p>
          <MemoryPhotoCarousel photos={entry.photos} />
          <div className="flex items-center gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => {
                setDraft(entry.text);
                setDraftPhotos(entry.photos || []);
                setEditing(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Pencil size={12} /> {t('memory.edit')}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={12} /> {t('memory.delete')}
            </button>
          </div>
        </>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('memory.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('memory.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('memory.keepMoment')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(entry.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('memory.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}