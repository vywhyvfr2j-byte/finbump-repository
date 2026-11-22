import React, { useMemo, useRef, useState } from 'react';
import VoiceInputButton from '@/components/memory/VoiceInputButton';
import { useKeepsake } from '@/lib/keepsakeStore';
import { formatDate } from '@/lib/keepsakeUtils';
import TopNav from '@/components/TopNav';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import ConnectionPicker from '@/components/people/ConnectionPicker';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { useI18n } from '@/lib/i18n/I18nContext';
import PrivacyHint from '@/components/PrivacyHint';

const MOMENT_PROMPTS = [
  'What made me smile today?',
  'What is one thing I appreciate about them?',
  'A moment I want to remember from today…',
  'Something kind they did for me recently.',
];

export default function PersonalNotes() {
  useEnsureEntities(['personalNotes']);
  const { t } = useI18n();
  const { personalNotes, addPersonalNote, deletePersonalNote, people } = useKeepsake();
  const [text, setText] = useState('');
  const [personId, setPersonId] = useState('');
  const voiceBaseRef = useRef('');

  const nameById = useMemo(
    () => new Map((people || []).map((p) => [String(p.id), p.preferredName || p.name])),
    [people]
  );

  const handleAdd = () => {
    if (!text.trim()) return;
    addPersonalNote(text.trim(), 'general', personId || null);
    setText('');
    setPersonId('');
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('personalNotes.title')} subtitle={t('personalNotes.subtitle')} back />

      <div className="px-5 mt-2">
        <div className="rounded-2xl border p-4 mb-5 shadow-card ks-card-tint">
          {/* Dictate instead of typing: the spoken words land in the box,
              added to whatever is already written there. */}
          <PrivacyHint className="mb-1.5" />
          <div className="flex flex-wrap gap-1.5 mb-2">
            {MOMENT_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setText((text ? text.trim() + ' ' : '') + p)}
                className="text-[11px] rounded-full bg-card border border-border px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-start gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('personalNotes.placeholder')}
              rows={4}
              className="flex-1"
            />
            <VoiceInputButton
              onStart={() => { voiceBaseRef.current = (text || '').trim(); }}
              onTranscript={(spoken) => setText([voiceBaseRef.current, spoken].filter(Boolean).join(' ').trim())}
              startLabel={t('home.voiceStart')}
              stopLabel={t('home.voiceStop')}
              listeningLabel={t('home.voiceListening')}
            />
          </div>
          <div className="mt-3">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="note-connection">
              {t('timeline.linkPerson')}
            </label>
            <ConnectionPicker id="note-connection" people={people} value={personId} onChange={setPersonId} />
          </div>
          <Button onClick={handleAdd} disabled={!text.trim()} className="w-full h-11 rounded-xl mt-3">
            {t('personalNotes.saveNote')}
          </Button>
        </div>

        <div className="rounded-2xl border px-4 py-4 shadow-card space-y-2.5 ks-card-tint">
          {personalNotes.map((n) => (
            <div key={n.id} className="bg-card rounded-2xl border border-border p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.text}</p>
              {n.personId && nameById.get(String(n.personId)) && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('timeline.aboutPerson', { name: nameById.get(String(n.personId)) })}
                </p>
              )}
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-xs text-muted-foreground">{formatDate(n.created_date || n.createdAt)}</span>
                <button onClick={() => deletePersonalNote(n.id)} className="text-muted-foreground">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {personalNotes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">{t('personalNotes.empty')}</p>
              <p className="text-sm mt-1">{t('personalNotes.emptyDesc')}</p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}