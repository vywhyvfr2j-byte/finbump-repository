import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import BrandLogo from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageSkeleton from '@/components/PageSkeleton';
import { Link } from 'react-router-dom';
import { Check, CalendarDays, MapPin, AlertCircle, Home as HomeIcon, Sparkles } from 'lucide-react';
import AiTripPlanCard from '@/components/vacation/AiTripPlanCard';
import TripInviteReservations from '@/components/vacation/TripInviteReservations';

// Public page reached from a trip invite email — the person filling this in may
// not have a FinBump account at all, so nothing here depends on app auth or the
// app data store. The trip + token come from the URL and are validated
// server-side on every call.

const TRAVEL_STYLES = ['Adventure', 'Relaxation', 'Culture', 'Food', 'Nature', 'City', 'Beach', 'Nightlife'];
const BUDGET_BANDS = ['Under $500', '$500–$1,000', '$1,000–$2,000', '$2,000–$4,000', '$4,000+'];

function toDateInputValue(d) {
  return d.toISOString().slice(0, 10);
}
function upcomingDays(count) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    out.push(d);
  }
  return out;
}
function fmtRange(start, end) {
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (!s || Number.isNaN(s.getTime())) return '';
  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (e && !Number.isNaN(e.getTime()) && toDateInputValue(s) !== toDateInputValue(e)) return `${fmt(s)} — ${fmt(e)}`;
  return fmt(s);
}

export default function TripInvite() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const tripId = params.get('t') || '';
  const token = params.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [data, setData] = useState(null);

  const [coming, setComing] = useState('');
  const [dates, setDates] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [destinationInput, setDestinationInput] = useState('');
  const [budget, setBudget] = useState('');
  const [travelStyle, setTravelStyle] = useState([]);
  const [dietary, setDietary] = useState('');
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState('');
  const [notes, setNotes] = useState('');
  const [optOut, setOptOut] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!tripId || !token) {
      setLoadError('This invite link is not valid.');
      setLoading(false);
      return () => { cancelled = true; };
    }
    base44.functions
      .invoke('get-trip-invite', { tripId, token })
      .then((res) => {
        if (cancelled) return;
        const d = res?.data || {};
        if (d.error) throw new Error(d.error);
        setData(d);
        setOptOut(!!d.you?.reminderOptOut);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.response?.data?.error || err?.message || 'This invite link is not valid.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tripId, token]);

  // Returning travelers see their earlier answers, not a blank form.
  useEffect(() => {
    const r = data?.you?.response;
    if (!r) return;
    setComing(r.coming || '');
    setDates((r.dates || []).map((d) => new Date(`${d}T01:00:00`)).filter((d) => !Number.isNaN(d.getTime())));
    setDestinations(r.destinations || []);
    setBudget(r.budget || '');
    setTravelStyle(r.travelStyle || []);
    setDietary(r.dietary || '');
    setInterests(r.interests || []);
    setNotes(r.notes || '');
  }, [data]);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const addDestination = (value) => {
    const v = value.trim();
    if (!v || destinations.includes(v) || destinations.length >= 8) return;
    setDestinations([...destinations, v]);
    setDestinationInput('');
  };
  const addInterest = (value) => {
    const v = value.trim();
    if (!v || interests.includes(v) || interests.length >= 12) return;
    setInterests([...interests, v]);
    setInterestInput('');
  };

  const submit = async () => {
    setSaveError('');
    setSaving(true);
    try {
      const res = await base44.functions.invoke('respond-to-trip', {
        tripId,
        token,
        response: {
          coming,
          dates: dates.map(toDateInputValue),
          destinations,
          budget,
          travelStyle,
          dietary,
          interests,
          notes,
          reminderOptOut: optOut,
        },
      });
      const d = res?.data || {};
      if (d.error) throw new Error(d.error);
      setDone(true);
    } catch (err) {
      setSaveError(err?.response?.data?.error || err?.message || 'Could not save your answers.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[100dvh] bg-background"><PageSkeleton /></div>;

  const trip = data?.trip;

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
          <p className="font-display text-lg font-semibold flex-1 min-w-0 truncate">Trip invitation</p>
          <Link
            to="/"
            aria-label="Home"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card text-sm font-medium shrink-0 hover:bg-secondary/60 transition-colors"
          >
            <HomeIcon size={16} />
            Home
          </Link>
        </header>

        {loadError && (
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <AlertCircle size={28} className="mx-auto mb-3" />
            <p className="font-display font-semibold mb-1">This invitation isn't available</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
        )}

        {trip && (
          <>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card mb-5">
              <p className="text-sm text-muted-foreground mb-1">
                {trip.hostName ? `${trip.hostName} invited you to plan` : "You're invited to plan"} {trip.name}
              </p>
              <h1 className="font-display text-xl font-semibold mb-3">{trip.name}</h1>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays size={15} />
                  {fmtRange(trip.startDate, trip.endDate) || 'Dates to be decided together'}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={15} />
                  {trip.destination || 'Destination to be decided together'}
                </p>
              </div>
              {trip.notes && (
                <p className="mt-4 text-sm leading-relaxed rounded-xl bg-muted/60 p-3.5 whitespace-pre-wrap">{trip.notes}</p>
              )}
              {(data.others || []).length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Also invited: {data.others.map((o) => o.name).join(', ')}
                </p>
              )}
            </div>

            {data.aiPlan && (
              <div className="rounded-2xl border border-border p-5 shadow-card mb-5 ks-card-tint">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-primary" />
                  <p className="font-medium text-sm">AI destination ideas</p>
                </div>
                <AiTripPlanCard aiPlan={data.aiPlan} />
                <p className="text-[11px] text-muted-foreground mt-3">
                  {trip.hostName || 'Your host'} built this from everyone's answers. Add your own reservation ideas below.
                </p>
              </div>
            )}

            <TripInviteReservations
              tripId={tripId}
              token={token}
              reservations={data.reservations}
              travelerName={data.you?.name}
            />

            {done ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                  <Check size={22} />
                </div>
                <p className="font-display text-lg font-semibold mb-1">Your preferences are saved</p>
                <p className="text-sm text-muted-foreground mb-5">
                  {trip.hostName || 'Your host'} will see your answers and can build a plan that works for everyone.
                </p>
                <Button variant="outline" className="h-11" onClick={() => setDone(false)}>
                  Change my answers
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <section>
                  <p className="text-sm font-medium mb-2.5">Can you make it?</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'yes', label: "I'm in" },
                      { value: 'maybe', label: 'Maybe' },
                      { value: 'no', label: "Can't make it" },
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
                  <p className="text-sm font-medium mb-2.5">When are you free? (next 30 days)</p>
                  <div className="flex flex-wrap gap-2">
                    {upcomingDays(30).map((d) => {
                      const active = dates.some((x) => toDateInputValue(x) === toDateInputValue(d));
                      return (
                        <button
                          key={toDateInputValue(d)}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setDates(
                              active
                                ? dates.filter((x) => toDateInputValue(x) !== toDateInputValue(d))
                                : [...dates, d],
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
                  <p className="text-sm font-medium mb-2.5">Where would you love to go?</p>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {destinations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDestinations(destinations.filter((x) => x !== d))}
                        className="px-3 h-8 rounded-full bg-secondary text-xs font-medium"
                      >
                        {d} ✕
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={destinationInput}
                      onChange={(e) => setDestinationInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDestination(destinationInput); } }}
                      placeholder="e.g. Mountain cabin, Charleston, a beach"
                      className="h-11"
                    />
                    <Button variant="outline" className="h-11 shrink-0" onClick={() => addDestination(destinationInput)}>
                      Add
                    </Button>
                  </div>
                </section>

                <section>
                  <p className="text-sm font-medium mb-2.5">What's your travel style?</p>
                  <div className="flex flex-wrap gap-2">
                    {TRAVEL_STYLES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={travelStyle.includes(s)}
                        onClick={() => toggle(travelStyle, setTravelStyle, s)}
                        className={chip(travelStyle.includes(s))}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="text-sm font-medium mb-2.5">Budget comfort (per person)</p>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger className="h-11" aria-label="Budget comfort">
                      <SelectValue placeholder="Pick one" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_BANDS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>

                <section>
                  <label className="text-sm font-medium block mb-2.5" htmlFor="trip-dietary">
                    Dietary needs
                  </label>
                  <Input
                    id="trip-dietary"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="e.g. Vegetarian, gluten-free, allergies"
                    className="h-11"
                  />
                </section>

                <section>
                  <p className="text-sm font-medium mb-2.5">Things you love doing</p>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {interests.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setInterests(interests.filter((x) => x !== i))}
                        className="px-3 h-8 rounded-full bg-secondary text-xs font-medium"
                      >
                        {i} ✕
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest(interestInput); } }}
                      placeholder="e.g. Hiking, live music, wine tasting"
                      className="h-11"
                    />
                    <Button variant="outline" className="h-11 shrink-0" onClick={() => addInterest(interestInput)}>
                      Add
                    </Button>
                  </div>
                </section>

                <section>
                  <label className="text-sm font-medium block mb-2.5" htmlFor="trip-notes">
                    Anything else?
                  </label>
                  <Textarea
                    id="trip-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Accessibility, who you're traveling with, must-sees…"
                    className="min-h-[80px]"
                  />
                </section>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm pr-3">Send me a reminder if the plan isn't settled</p>
                  <Switch checked={optOut} onCheckedChange={setOptOut} aria-label="Reminder opt-out" />
                </div>

                {saveError && <p className="text-sm text-destructive">{saveError}</p>}

                <Button className="h-12 w-full" onClick={submit} disabled={saving}>
                  {saving ? 'Saving…' : 'Share my preferences'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}