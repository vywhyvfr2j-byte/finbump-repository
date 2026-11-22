import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toDateInputValue } from '@/lib/mealConstants';

// Locks in the plan and emails everyone. Prefilled from the AI suggestion when
// one exists, but every field stays editable — the host has the final say.
export default function ConfirmMealForm({ meal, onConfirmed }) {
  const { t } = useI18n();
  const plan = meal?.aiPlan;

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  // A place picked with AI is already on the meal, so it starts filled in.
  const [venueName, setVenueName] = useState(meal?.venueName || '');
  const [venueAddress, setVenueAddress] = useState(meal?.venueAddress || '');
  const [cuisine, setCuisine] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Seed from the AI plan whenever a new one arrives.
  useEffect(() => {
    if (!plan) return;
    if (plan.dateTime) {
      const d = new Date(plan.dateTime);
      if (!Number.isNaN(d.getTime())) {
        setDate(toDateInputValue(d));
        setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
    }
    if (plan.venueName) setVenueName(plan.venueName);
    if (plan.venueAddress) setVenueAddress(plan.venueAddress);
    if (plan.cuisine) setCuisine(plan.cuisine);
  }, [plan?.venueName, plan?.dateTime, plan?.venueAddress, plan?.cuisine]);

  const submit = async () => {
    setError('');
    if (!date) return setError(t('meal.needDate'));
    if (!venueName.trim()) return setError(t('meal.needVenue'));

    setSaving(true);
    try {
      const dateTime = new Date(`${date}T${time || '18:00'}:00`).toISOString();
      const res = await base44.functions.invoke('confirm-meal-plan', {
        mealId: meal.id,
        dateTime,
        venueName: venueName.trim(),
        venueAddress: venueAddress.trim(),
        cuisine: cuisine.trim(),
      });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      onConfirmed(data.meal);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t('meal.confirmFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-card">
      <h2 className="font-display text-base font-semibold">{t('meal.confirmTitle')}</h2>
      <p className="text-xs text-muted-foreground">{t('meal.confirmDesc')}</p>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="confirm-date">
            {t('meal.date')}
          </label>
          <Input id="confirm-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
        </div>
        <div className="w-28">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="confirm-time">
            {t('meal.time')}
          </label>
          <Input id="confirm-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="confirm-venue">
          {t('meal.venue')}
        </label>
        <Input
          id="confirm-venue"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          placeholder={t('meal.venuePlaceholder')}
          className="h-11"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="confirm-address">
          {t('meal.venueAddress')}
        </label>
        <Input
          id="confirm-address"
          value={venueAddress}
          onChange={(e) => setVenueAddress(e.target.value)}
          placeholder={t('meal.addressPlaceholder')}
          className="h-11"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="confirm-cuisine">
          {t('meal.foodLabel')}
        </label>
        <Input
          id="confirm-cuisine"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          placeholder={t('meal.foodPlaceholder')}
          className="h-11"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={saving} className="h-11 w-full">
        {saving ? t('meal.confirming') : t('meal.confirmAndNotify')}
      </Button>
    </div>
  );
}