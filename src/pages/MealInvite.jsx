import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n/I18nContext';
import BrandLogo from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageSkeleton from '@/components/PageSkeleton';
import {
  MEAL_AREAS,
  MEAL_BUDGETS,
  MEAL_CUISINES,
  MEAL_TIMES,
  formatMealWhen,
  toDateInputValue,
  upcomingDays,
} from '@/lib/mealConstants';
import { Link } from 'react-router-dom';
import { Check, CalendarDays, MapPin, Utensils, AlertCircle, Home as HomeIcon } from 'lucide-react';

// Public page reached from an invite email — the person filling this in may not
// have a FinBump account at all, so nothing here depends on app auth or the
// app data store. The meal + token come from the URL and are validated
// server-side on every call.
export default function MealInvite() {
  const { t } = useI18n();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const mealId = params.get('m') || '';
  const token = params.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [data, setData] = useState(null);

  const [days, setDays] = useState([]);
  const [time, setTime] = useState('');
  const [cuisines, setCuisines] = useState([]);
  const [cuisineInput, setCuisineInput] = useState('');
  const [areas, setAreas] = useState([]);
  const [areaInput, setAreaInput] = useState('');
  const [budget, setBudget] = useState('');
  const [coming, setComing] = useState('');
  const [dietary, setDietary] = useState('');
  const [notes, setNotes] = useState('');
  const [optOut, setOptOut] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [done, setDone] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!mealId || !token) {
      setLoadError(t('meal.invalidLink'));
      setLoading(false);
      return () => { cancelled = true; };
    }
    base44.functions
      .invoke('get-meal-invite', { mealId, token })
      .then((res) => {
        if (cancelled) return;
        const d = res?.data || {};
        if (d.error) throw new Error(d.error);
        setData(d);
        setOptOut(!!d.you?.reminderOptOut);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.response?.data?.error || err?.message || t('meal.invalidLink'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mealId, token, t]);

  // Returning invitees see their earlier answers, not a blank form.
  useEffect(() => {
    const r = data?.you?.response;
    if (!r) return;
    const ds = (r.slots || [])
      .map((s) => new Date(`${s.date}T00:00:00`))
      .filter((d) => !Number.isNaN(d.getTime()));
    setDays(ds);
    setTime((r.slots || [])[0]?.time || '');
    setCuisines(r.cuisines || []);
    setAreas(r.areas || []);
    setBudget(r.budget || '');
    setComing(r.coming || '');
    setDietary(r.dietary || '');
    setNotes(r.notes || '');
  }, [data]);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const addArea = (value) => {
    const v = value.trim();
    if (!v || areas.includes(v) || areas.length >= 4) return;
    setAreas([...areas, v]);
    setAreaInput('');
  };

  // The presets plus any food choice typed in, so it renders as a chip that can
  // be tapped off again.
  const cuisineOptions = useMemo(
    () => [...MEAL_CUISINES, ...cuisines.filter((c) => !MEAL_CUISINES.includes(c))],
    [cuisines],
  );

  const addCuisine = (value) => {
    const v = value.trim();
    if (!v || cuisines.includes(v) || cuisines.length >= 6) return;
    setCuisines([...cuisines, v]);
    setCuisineInput('');
  };

  const submit = async () => {
    setSaveError('');
    setSaving(true);
    try {
      const slots = days.map((d) => ({ date: toDateInputValue(d), time }));
      const res = await base44.functions.invoke('respond-to-meal', {
        mealId,
        token,
        response: { coming, slots, cuisines, areas, budget, dietary, notes, reminderOptOut: optOut },
      });
      const d = res?.data || {};
      if (d.error) throw new Error(d.error);
      setDone(true);
    } catch (err) {
      setSaveError(err?.response?.data?.error || err?.message || t('meal.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[100dvh] bg-background"><PageSkeleton /></div>;

  const meal = data?.meal;
  const confirmed = meal?.status === 'confirmed';

  const chip = (active) =>
    `px-3 h-9 rounded-full border text-sm transition-colors ${
      active
        ? 'border-primary bg-primary/10 text-foreground font-medium'
        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
    }`;

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-[440px] mx-auto px-5 pb-16">
        <header className="flex items-center gap-2.5 pt-[calc(18px+env(safe-area-inset-top))] pb-4">
          <BrandLogo size={30} />
          <p className="font-display text-lg font-semibold flex-1 min-w-0 truncate">{t('meal.inviteHeading')}</p>
          <Link
            to="/"
            aria-label={t('nav.home')}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card text-sm font-medium shrink-0 hover:bg-secondary/60 transition-colors"
          >
            <HomeIcon size={16} />
            {t('nav.home')}
          </Link>
        </header>

        {loadError && (
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <AlertCircle size={28} className="mx-auto mb-3" />
            <p className="font-display font-semibold mb-1">{t('meal.inviteUnavailable')}</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
        )}

        {meal && (
          <>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card mb-5">
              <p className="text-sm text-muted-foreground mb-1">
                {t('meal.inviteFrom', { host: meal.hostName || t('meal.someone') })}
              </p>
              <h1 className="font-display text-xl font-semibold mb-3">{meal.title}</h1>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays size={15} />
                  {formatMealWhen(meal.confirmedDate || meal.proposedDate) || t('meal.noDateYet')}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={15} />
                  {meal.venueName
                    ? `${meal.venueName}${meal.venueAddress ? ` — ${meal.venueAddress}` : ''}`
                    : meal.area || t('meal.noPlaceYet')}
                </p>
                <p className="flex items-center gap-2">
                  <Utensils size={15} />
                  {meal.cuisine || t('meal.noFoodYet')}
                </p>
              </div>
              {meal.notes && (
                <p className="mt-4 text-sm leading-relaxed rounded-xl bg-muted/60 p-3.5 whitespace-pre-wrap">{meal.notes}</p>
              )}
              {(data.others || []).length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {t('meal.alsoInvited', { names: data.others.map((o) => o.name).join(', ') })}
                </p>
              )}
            </div>

            {done ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                  <Check size={22} />
                </div>
                <p className="font-display text-lg font-semibold mb-1">{t('meal.answersSent')}</p>
                <p className="text-sm text-muted-foreground mb-5">
                  {t('meal.answersSentDesc', { host: meal.hostName || t('meal.theHost') })}
                </p>
                <Button variant="outline" className="h-11" onClick={() => setDone(false)}>
                  {t('meal.changeAnswers')}
                </Button>
              </div>
            ) : confirmed && !showForm ? (
              <div className="rounded-2xl border border-border bg-card p-5 text-center">
                <p className="font-display font-semibold mb-1">{t('meal.alreadyConfirmed')}</p>
                <p className="text-sm text-muted-foreground mb-4">{t('meal.alreadyConfirmedDesc')}</p>
                <Button variant="outline" className="h-11" onClick={() => setShowForm(true)}>
                  {t('meal.stillRespond')}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <section>
                  <p className="text-sm font-medium mb-2.5">{t('meal.rsvpLabel')}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'yes', label: t('meal.rsvpYes') },
                      { value: 'maybe', label: t('meal.rsvpMaybe') },
                      { value: 'no', label: t('meal.rsvpNo') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={coming === option.value}
                        onClick={() => setComing(coming === option.value ? '' : option.value)}
                        className={chip(coming === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="text-sm font-medium mb-2.5">{t('meal.whichDays')}</p>
                  <div className="flex flex-wrap gap-2">
                    {upcomingDays(14).map((d) => {
                      const active = days.some((x) => toDateInputValue(x) === toDateInputValue(d));
                      return (
                        <button
                          key={toDateInputValue(d)}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setDays(
                              active
                                ? days.filter((x) => toDateInputValue(x) !== toDateInputValue(d))
                                : [...days, d],
                            )
                          }
                          className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-colors ${
                            active ? 'border-primary bg-primary/10' : 'border-border bg-background'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {d.toLocaleDateString(undefined, { weekday: 'short' })}
                          </span>
                          <span className="text-sm font-medium">{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <p className="text-sm font-medium mb-2.5">{t('meal.bestTime')}</p>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_TIMES.map((tm) => (
                      <button
                        key={tm}
                        type="button"
                        aria-pressed={time === tm}
                        onClick={() => setTime(time === tm ? '' : tm)}
                        className={chip(time === tm)}
                      >
                        {tm}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="text-sm font-medium mb-2.5">{t('meal.foodYouLike')}</p>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {cuisineOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={cuisines.includes(c)}
                        onClick={() => toggle(cuisines, setCuisines, c)}
                        className={chip(cuisines.includes(c))}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={cuisineInput}
                      onChange={(e) => setCuisineInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCuisine(cuisineInput);
                        }
                      }}
                      placeholder={t('meal.foodPlaceholder')}
                      aria-label={t('meal.foodPlaceholder')}
                      className="h-11"
                    />
                    <Button variant="outline" className="h-11 shrink-0" onClick={() => addCuisine(cuisineInput)}>
                      {t('meal.add')}
                    </Button>
                  </div>
                </section>

                <section>
                  <p className="text-sm font-medium mb-2.5">{t('meal.areaYouPrefer')}</p>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {MEAL_AREAS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        aria-pressed={areas.includes(a)}
                        onClick={() => toggle(areas, setAreas, a)}
                        className={chip(areas.includes(a))}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={areaInput}
                      onChange={(e) => setAreaInput(e.target.value)}
                      placeholder={t('meal.areaPlaceholder')}
                      aria-label={t('meal.areaYouPrefer')}
                      className="h-11"
                    />
                    <Button variant="outline" className="h-11 shrink-0" onClick={() => addArea(areaInput)}>
                      {t('meal.add')}
                    </Button>
                  </div>
                  {areas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {areas.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAreas(areas.filter((x) => x !== a))}
                          className="px-3 h-8 rounded-full bg-secondary text-xs font-medium"
                        >
                          {a} ✕
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <p className="text-sm font-medium mb-2.5">{t('meal.budgetComfort')}</p>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger className="h-11" aria-label={t('meal.budgetComfort')}>
                      <SelectValue placeholder={t('meal.pickOne')} />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_BUDGETS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>

                <section>
                  <label className="text-sm font-medium block mb-2.5" htmlFor="meal-dietary">
                    {t('meal.dietaryLabel')}
                  </label>
                  <Input
                    id="meal-dietary"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder={t('meal.dietaryPlaceholder')}
                    className="h-11"
                  />
                </section>

                <section>
                  <label className="text-sm font-medium block mb-2.5" htmlFor="meal-notes">
                    {t('meal.anythingElse')}
                  </label>
                  <Textarea
                    id="meal-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('meal.anythingElsePlaceholder')}
                    className="min-h-[80px]"
                  />
                </section>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm pr-3">{t('meal.remindersOptOut')}</p>
                  <Switch checked={optOut} onCheckedChange={setOptOut} aria-label={t('meal.remindersOptOut')} />
                </div>

                {saveError && <p className="text-sm text-destructive">{saveError}</p>}

                <Button className="h-12 w-full" onClick={submit} disabled={saving}>
                  {saving ? t('meal.sending') : t('meal.submitAnswers')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}