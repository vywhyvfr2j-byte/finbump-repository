import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

const WHO_LABEL = { me: 'Just me', partner: 'My partner', both: 'Me & my partner' };

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function itemLabel(it) {
  return it.label || it.title || it.text || it.name || '';
}

function buildTripSummary(trip, t) {
  const lines = [`${[t('app.tripLabel'), trip.name].filter(Boolean).join(': ')}`];
  if (trip.destination) lines.push(`Destination: ${trip.destination}`);
  const dateStr = [fmtDate(trip.startDate), fmtDate(trip.endDate)].filter(Boolean).join(' → ');
  if (dateStr) lines.push(`Dates: ${dateStr}`);
  if (trip.who) lines.push(`Who: ${WHO_LABEL[trip.who] || trip.who}`);

  if (Array.isArray(trip.itinerary) && trip.itinerary.length) {
    lines.push('', 'Itinerary:');
    trip.itinerary.forEach((it, i) => {
      const d = it.date ? fmtDate(it.date) : '';
      const label = itemLabel(it);
      lines.push(`${i + 1}. ${[d, label].filter(Boolean).join(' — ')}`);
    });
  }

  if (Array.isArray(trip.locations) && trip.locations.length) {
    lines.push('', 'Locations:');
    trip.locations.forEach((l) => {
      const name = l.name || l.label || l.address || '';
      if (name) lines.push(`• ${name}`);
    });
  }

  if (Array.isArray(trip.categories) && trip.categories.length) {
    const total = trip.categories.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    if (total) lines.push('', `Budget: $${total.toFixed(2)}`);
  }

  lines.push('', t('app.sharedFrom'));
  return lines.join('\n');
}

// Opens the native share sheet (text/email/messaging) with a formatted trip
// summary so the user can send it directly to their partner/spouse. Falls back
// to clipboard copy when the Web Share API is unavailable.
export default function ShareTripButton({ trip }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = buildTripSummary(trip, t);
    try {
      if (navigator.share) {
        await navigator.share({ title: trip.name || 'Our trip', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* clipboard unavailable */
      }
    }
  };

  return (
    <button
      onClick={share}
      className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary/60 transition-colors text-primary"
      aria-label="Share with partner"
    >
      {copied ? <Check size={20} className="text-emerald-600" /> : <Share2 size={20} />}
    </button>
  );
}