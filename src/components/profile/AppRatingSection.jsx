import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Labels only. A review submitted here is always recorded as in-app —
// the source is stamped server-side, so store reviews stay admin imports.
const SOURCES = [
  { value: 'in_app', label: 'In-app' },
  { value: 'apple', label: 'Apple App Store' },
  { value: 'google', label: 'Google Play' },
];

function Stars({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            <Star
              size={size}
              className={active ? 'fill-accent text-accent' : 'text-muted-foreground/40'}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function AppRatingSection() {
  const { t } = useI18n();
  const [summary, setSummary] = useState(null);
  const [mine, setMine] = useState([]);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const load = async () => {
    try {
      const [sumRes, mineRes] = await Promise.all([
        base44.functions.invoke('get-review-summary', {}),
        base44.entities.AppReview.filter({}),
      ]);
      setSummary(sumRes.data || sumRes);
      setMine(mineRes || []);
    } catch {
      // ignore — rating is non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (rating < 1 || submitting) return;
    setSubmitting(true);
    try {
      // Recorded through the server so the review source can't be spoofed.
      await base44.functions.invoke('submit-review', {
        rating,
        reviewText: text.trim(),
      });
      setRating(0);
      setText('');
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 4000);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const sourceLabel = (s) => SOURCES.find((x) => x.value === s)?.label || s;

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground">{t('app.rateApp')}</p>
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : summary && summary.total > 0 ? (
          <div className="mt-1">
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-display text-2xl font-semibold">{summary.average}</span>
              <Star size={18} className="fill-accent text-accent" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              from {summary.total} review{summary.total === 1 ? '' : 's'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">Be the first to rate us!</p>
        )}
      </div>

      {justSubmitted && (
        <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-sm">
          <CheckCircle2 size={16} />
          <span>Thanks for your review!</span>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your rating</label>
          <Stars value={rating} onChange={setRating} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your review (optional)</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Tell us what you think…"
            aria-label="Your review"
          />
        </div>
        <Button onClick={submit} disabled={rating < 1 || submitting} className="w-full h-11 rounded-xl">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit review'}
        </Button>
      </div>

      {mine.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Your reviews</p>
          {mine.map((r) => (
            <div key={r.id} className="bg-secondary/60 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} onChange={() => {}} size={16} />
                <span className="text-xs text-muted-foreground">{sourceLabel(r.source)}</span>
              </div>
              {r.reviewText && <p className="text-sm">{r.reviewText}</p>}
              {r.adminResponse && (
                <div className="mt-1.5 rounded-lg bg-card border border-border p-2">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{t('app.devResponse')}</p>
                  <p className="text-sm">{r.adminResponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}