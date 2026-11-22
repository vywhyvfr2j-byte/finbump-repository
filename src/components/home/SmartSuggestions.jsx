import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { Lightbulb, Clock, Trash2, Plus, HeartPulse, Mail, Gift } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Proactive suggestions shown on Home when the user has gaps in their
// relationship care — neglected connections, stale cadences, missing
// reach-out reminders, or upcoming occasions with no gift idea.
// Each suggestion is a compact row with contextual action chips:
//   - act/care suggestions → Add act / Care & prayer
//   - occasion suggestions  → Send card (→ card builder) / Send gift (→ gift tracker)
// Suggestions can be snoozed for a week or dismissed.
const SNOOZE_KEY = 'keepsake:smart-suggestions-snoozed';
const DISMISS_KEY = 'keepsake:smart-suggestions-dismissed';
const SNOOZE_MS = 7 * 86400000;

function loadSnoozed() {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    return Object.fromEntries(Object.entries(obj).filter(([, until]) => until > now));
  } catch {
    return {};
  }
}

function loadDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export default function SmartSuggestions() {
  const allSuggestions = useSmartSuggestions();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [snoozed, setSnoozed] = useState(loadSnoozed);
  const [dismissed, setDismissed] = useState(loadDismissed);

  useEffect(() => {
    try {
      localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozed));
    } catch {}
  }, [snoozed]);

  useEffect(() => {
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed]));
    } catch {}
  }, [dismissed]);

  const now = Date.now();
  const suggestions = allSuggestions.filter((s) => {
    if (dismissed.has(s.id)) return false;
    const until = snoozed[s.id];
    if (until && until > now) return false;
    return true;
  });

  if (suggestions.length === 0) return null;

  const handleSnooze = (s) => {
    setSnoozed((prev) => ({ ...prev, [s.id]: Date.now() + SNOOZE_MS }));
  };

  const handleDelete = (s) => {
    setDismissed((prev) => new Set([...prev, s.id]));
  };

  const isOccasion = (s) => s.type === 'gift-gap';

  const sendCard = (s) => {
    const pid = s.event?.personId;
    navigate(pid ? `/card-builder?personId=${encodeURIComponent(pid)}` : '/card-builder');
  };

  const sendGift = (s) => {
    const name = s.event ? (s.event.name || '').split("'s")[0].trim() : '';
    navigate(name ? `/gift-tracker?person=${encodeURIComponent(name)}` : '/gift-tracker');
  };

  const ActionChip = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 min-h-[44px] -my-2.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
    >
      <Icon size={12} /> {label}
    </button>
  );

  return (
    <div className="px-5 mt-4">
      <div className="rounded-2xl border px-3 py-3 shadow-card ks-card-tint">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={16} className="text-primary" />
          <h2 className="font-display text-sm font-semibold">{t('home.smartSuggestions')}</h2>
        </div>
        <div className="space-y-1.5">
          {suggestions.map((s) => (
            <div key={s.id} className="rounded-lg bg-card border border-border/60 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium leading-snug flex-1">{s.title}</p>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => handleSnooze(s)}
                    aria-label={t('home.snoozeSuggestion')}
                    title={t('home.snoozeForWeek')}
                    className="relative ks-hit flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <Clock size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    aria-label={t('home.dismissSuggestion')}
                    title={t('home.dismiss')}
                    className="relative ks-hit flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                {isOccasion(s) ? (
                  <>
                    <ActionChip icon={Mail} label={t('home.sendCard')} onClick={() => sendCard(s)} />
                    <ActionChip icon={Gift} label={t('home.sendGift')} onClick={() => sendGift(s)} />
                  </>
                ) : (
                  <>
                    <ActionChip icon={Plus} label={t('home.addActChip')} onClick={() => navigate('/add-act')} />
                    <ActionChip icon={HeartPulse} label={t('home.carePrayer')} onClick={() => navigate('/prayer')} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}