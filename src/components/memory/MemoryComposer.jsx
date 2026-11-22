import React, { useRef, useState } from 'react';
import { Moon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Textarea } from '@/components/ui/textarea';
import VoiceInputButton from '@/components/memory/VoiceInputButton';
import MemoryPhotoPicker from '@/components/memory/MemoryPhotoPicker';

// Local calendar day (not UTC) so "today's moment" matches the user's evening.
export function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Tonight's question. The answer lands on the timeline the moment it is saved
// and is written to the backend behind the user; if that write fails the words
// and pictures go back in the box with the error, so nothing is ever lost.
export default function MemoryComposer() {
  const { t } = useI18n();
  const { personalNotes, saveMemoryMoment, updateMyPreferences } = useKeepsake();
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const [photos, setPhotos] = useState([]);
  const baseRef = useRef('');
  const busyRef = useRef(false);
  const today = localDayKey();
  const pending = !Array.isArray(personalNotes);
  const answeredToday = (Array.isArray(personalNotes) ? personalNotes : []).some(
    (n) => n.type === 'memory' && n.memoryDate === today
  );

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed || busyRef.current || pending) return;
    busyRef.current = true;
    setError(false);
    const keptPhotos = photos;
    const { persisted } = saveMemoryMoment(trimmed, today, keptPhotos);
    setText('');
    setPhotos([]);
    persisted
      .then(() => {
        // Usage signal for the evening habit. Fire-and-forget: a tracking
        // failure must never make a saved moment look like it failed.
        base44.functions
          .invoke('track-analytics-event', { eventName: 'memory_moment_logged', feature: 'memory' })
          .catch(() => {});
        // Marks today as answered so the evening message doesn't ask again.
        updateMyPreferences({ lastMemoryDate: today });
      })
      .catch(() => {
        setText(trimmed);
        setPhotos(keptPhotos);
        setError(true);
      })
      .finally(() => {
        busyRef.current = false;
      });
  };

  return (
    <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-4 shadow-card">
      <div className="flex items-center gap-2 mb-1.5">
        <Moon size={18} className="text-primary" />
        <h2 className="font-display text-lg font-semibold">{t('memory.title')}</h2>
      </div>
      <p className="text-sm font-medium">{t('memory.question')}</p>
      <p className="text-xs text-muted-foreground mt-1 mb-3">{t('memory.hint')}</p>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('memory.placeholder')}
        aria-label={t('memory.answerAria')}
        rows={3}
        disabled={pending}
        className="bg-card/60"
      />

      <div className="mt-2.5">
        <MemoryPhotoPicker photos={photos} onChange={setPhotos} />
      </div>

      <div className="flex items-center justify-between gap-3 mt-3">
        <VoiceInputButton
          onStart={() => {
            baseRef.current = text;
          }}
          onTranscript={(spoken) => setText([baseRef.current, spoken].filter(Boolean).join(' ').trim())}
        />
        <button
          onClick={handleSave}
          disabled={!text.trim() || pending}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-40 transition-opacity"
        >
          {t('memory.save')}
        </button>
      </div>

      {error ? (
        <p className="text-xs text-destructive mt-2">{t('memory.saveError')}</p>
      ) : (
        answeredToday && <p className="text-xs text-primary mt-2">{t('memory.savedToday')}</p>
      )}
    </div>
  );
}