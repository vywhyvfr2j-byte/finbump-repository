import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Dictation with the browser's own speech recognition, so the user can recite
// what they want written instead of typing it. Nothing is recorded or stored by
// this app — the recognised words are typed straight into the box.
// Renders nothing on browsers without speech recognition.
// The labels default to the Memory Moments wording; other callers pass their own.
export default function VoiceInputButton({ onStart, onTranscript, startLabel, stopLabel, listeningLabel }) {
  const { t, language } = useI18n();
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const startText = startLabel || t('memory.startVoice');
  const stopText = stopLabel || t('memory.stopVoice');
  const listeningText = listeningLabel || t('memory.listening');

  const SpeechRecognition =
    typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  useEffect(
    () => () => {
      try {
        recRef.current?.stop();
      } catch {
        // recognition already stopped
      }
    },
    []
  );

  if (!SpeechRecognition) return null;

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {
      // recognition already stopped
    }
    setListening(false);
  };

  const start = () => {
    const rec = new SpeechRecognition();
    rec.lang = language === 'es' ? 'es-ES' : 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) finalText += `${result[0].transcript} `;
        else interim += result[0].transcript;
      }
      onTranscript(`${finalText}${interim}`.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    onStart?.();
    setListening(true);
    rec.start();
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-label={listening ? stopText : startText}
        title={listening ? stopText : startText}
        className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border transition-colors ${
          listening
            ? 'bg-primary text-primary-foreground border-primary motion-safe:animate-pulse'
            : 'bg-card/60 border-input text-primary hover:bg-secondary/60'
        }`}
      >
        {listening ? <Square size={16} /> : <Mic size={18} />}
      </button>
      {listening && <span className="text-xs text-primary truncate">{listeningText}</span>}
    </div>
  );
}