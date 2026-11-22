import React, { useState, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Plus, X, User, Heart, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TripInvitePicker from '@/components/vacation/TripInvitePicker';
import TripTypePicker from '@/components/vacation/TripTypePicker';
import { sendTripInvites } from '@/lib/tripInvite';
import { readTripIdeaState, writeTripIdeaState } from '@/lib/tripIdeaStorage';

const WHO_LABEL = { me: 'Just me', partner: 'My partner', both: 'Me & my partner' };
const WHO_ICON = { me: User, partner: Heart, both: Users };

// Free-text prompt → specific, addable trip ideas powered by the LLM with web context.
export default function AITripIdeas({ partner, myPreferences, existingTrips = [], onOpenTrip, onAddManually, onReview, people = [] }) {
  const { addTrip, addEvent } = useKeepsake();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [added, setAdded] = useState({});
  const [manualIdea, setManualIdea] = useState('');
  // Travelers to invite when an idea is added — connects the trip to real
  // people and starts collaboration, mirroring the dinner planner.
  const [invitees, setInvitees] = useState([]);
  // Trip types to favor (Beach, Mountain, Fishing…) — mirrors the dinner
  // planner's cuisine chips and shapes the AI search.
  const [tripType, setTripType] = useState('');
  // Optional travel window so the AI times suggestions to when the user can
  // actually go, and added trips carry these dates instead of a guess.
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Keep the card's transient results in sessionStorage so navigating to the
  // review page and back doesn't wipe the ideas the user just searched for.
  useEffect(() => {
    const saved = readTripIdeaState();
    if (!saved) return;
    if (Array.isArray(saved.suggestions)) setSuggestions(saved.suggestions);
    if (saved.added) setAdded(saved.added);
    if (saved.prompt) setPrompt(saved.prompt);
    if (saved.tripType) setTripType(saved.tripType);
    if (saved.startDate) setStartDate(saved.startDate);
    if (saved.endDate) setEndDate(saved.endDate);
    if (Array.isArray(saved.invitees)) setInvitees(saved.invitees);
  }, []);
  useEffect(() => {
    writeTripIdeaState({ suggestions, added, prompt, tripType, startDate, endDate, invitees });
  }, [suggestions, added, prompt, tripType, startDate, endDate, invitees]);

  const findIdeas = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const context = [
        `Suggest 4 specific upcoming trip ideas that match this request: "${prompt.trim()}".`,
        tripType.trim() ? `Favor these kinds of trips: ${tripType.split(',').map((x) => x.trim()).filter(Boolean).join(', ')}.` : '',
        startDate && endDate ? `Target travel window: ${startDate} to ${endDate}. Suggest trips that fit within this window and set monthsAhead so the trip lands inside it.` : (startDate ? `Earliest travel date: ${startDate}.` : ''),
        myPreferences?.travelMode && myPreferences?.travelDestination
          ? `I'm currently traveling near ${myPreferences.travelDestination}.`
          : '',
        partner?.name ? `I'm planning for me and my partner ${partner.name}.` : 'I\'m planning for me and my partner.',
        partner?.birthday ? `Their birthday is ${partner.birthday}.` : '',
        partner?.anniversary ? `Our anniversary is ${partner.anniversary}.` : '',
        partner?.notes ? `Notes about them: ${partner.notes}.` : '',
        partner?.preferences
          ? `Their preferences: ${Object.entries(partner.preferences).map(([k, v]) => `${k}: ${v}`).join('; ')}.`
          : '',
        partner?.zipCode ? `Home zip code: ${partner.zipCode} — favor ideas reachable from there.` : '',
        existingTrips.length ? `Trips already planned — don't repeat these destinations: ${existingTrips.join(', ')}.` : '',
        `Today is ${today} (America/Chicago).`,
        'Return concrete ideas — name each, give a specific destination, suggest a kind (Weekend / Day trip / Long weekend / Week), duration in days, how many months from now to schedule it, who it fits (both / me / partner), a one-sentence reason it matches the prompt, and 2-4 highlights (real places, events, or experiences).',
      ].filter(Boolean).join(' ');

      const res = await base44.functions.invoke('invoke-premium-llm', {
        prompt: context,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  destination: { type: 'string' },
                  kind: { type: 'string' },
                  days: { type: 'number' },
                  monthsAhead: { type: 'number' },
                  who: { type: 'string' },
                  reason: { type: 'string' },
                  highlights: { type: 'array', items: { type: 'string' } },
                },
                required: ['title', 'destination'],
              },
            },
          },
          required: ['suggestions'],
        },
      });

      setSuggestions(res?.data?.suggestions || []);
      setAdded({});
    } catch (err) {
      console.error('AITripIdeas: premium LLM call failed', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const addSuggestion = async (s) => {
    const who = ['me', 'partner', 'both'].includes(s.who) ? s.who : 'both';
    // Use the user's chosen travel window when they picked one; otherwise fall
    // back to the AI's monthsAhead/days estimate so a date-less search still
    // lands a sensible start and end.
    let tripStart = startDate;
    let tripEnd = endDate;
    if (!tripStart) {
      const now = new Date();
      const months = Number(s.monthsAhead) || 0;
      const days = Number(s.days) || 0;
      if (months || days) {
        const start = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
        tripStart = start.toISOString().slice(0, 10);
        if (days) {
          const end = new Date(start);
          end.setDate(end.getDate() + Math.max(1, days - 1));
          tripEnd = end.toISOString().slice(0, 10);
        }
      }
    }
    const tripId = 'tr' + Date.now();
    const firstConnection = invitees.find((i) => i.personId);
    addTrip({
      id: tripId,
      name: s.title,
      destination: s.destination,
      startDate: tripStart,
      endDate: tripEnd,
      who,
      tripType,
      personId: firstConnection?.personId || '',
    });
    if (tripStart) {
      addEvent({
        name: `${s.title} trip`,
        date: new Date(tripStart).toISOString(),
        type: 'trip',
        note: s.destination ? `Trip to ${s.destination}` : '',
        reminderDays: [7, 1],
        tripId,
      });
    }
    setAdded((a) => ({ ...a, [`${s.title}|${s.destination}`]: tripId }));

    // Invite the picked travelers right away so the trip is connected to real
    // people and collaboration starts immediately, like the dinner planner.
    if (invitees.length > 0) {
      try {
        const r = await sendTripInvites({
          tripId,
          name: s.title,
          destination: s.destination || '',
          startDate: tripStart,
          endDate: tripEnd,
          invitees,
        });
        toast({
          title: 'Trip created',
          description: r?.inviteCount ? `Invitations sent to ${r.inviteCount}.` : 'Invitations sent.',
        });
      } catch (err) {
        toast({
          title: 'Trip created',
          description: err?.message || 'Open the trip to invite your travelers.',
        });
      }
    }
  };

  const clear = () => {
    setSuggestions([]);
    setPrompt('');
    setAdded({});
  };

  const addManualIdea = () => {
    if (!manualIdea.trim()) return;
    setSuggestions((prev) => [{ title: manualIdea.trim(), destination: '', isManual: true }, ...prev]);
    setManualIdea('');
  };

  return (
    <div className="rounded-2xl border p-4 mb-5 shadow-card ks-card-tint">
      <div className="flex items-center gap-3 mb-3">
        <Sparkles className="text-accent-foreground shrink-0" size={18} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">AI Trip Ideas</p>
          <p className="text-xs text-muted-foreground">Describe a vibe, occasion, or destination — get specific addable trips.</p>
        </div>
        {suggestions.length > 0 && (
          <button onClick={clear} className="text-muted-foreground shrink-0">
            <X size={16} />
          </button>
        )}
      </div>
      <Input
        id="ai-trip-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && findIdeas()}
        placeholder="Enter info here"
        className="h-11"
      />
      <div className="mt-2.5">
        <TripTypePicker value={tripType} onChange={setTripType} />
      </div>
      <div className="flex gap-2 mt-2.5">
        <div className="flex-1 min-w-0">
          <label htmlFor="ai-trip-start" className="text-xs font-medium text-muted-foreground block mb-1.5">Trip from</label>
          <Input id="ai-trip-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 min-w-0 w-full" />
        </div>
        <div className="flex-1 min-w-0">
          <label htmlFor="ai-trip-end" className="text-xs font-medium text-muted-foreground block mb-1.5">Trip to</label>
          <Input id="ai-trip-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 min-w-0 w-full" />
        </div>
      </div>
      <Button onClick={findIdeas} disabled={loading || !prompt.trim()} className="w-full h-11 rounded-xl mt-2.5">
        {loading ? 'Searching…' : 'Find trip ideas'}
      </Button>

      <div className="mt-3 pt-3 border-t border-accent/30">
        <TripInvitePicker people={people} invitees={invitees} onChange={setInvitees} />
      </div>

      <div className="mt-3 pt-3 border-t border-accent/30">
        <p className="text-xs font-medium text-muted-foreground mb-2">Write your own idea</p>
        <div className="flex gap-2">
          <Input
            value={manualIdea}
            onChange={(e) => setManualIdea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addManualIdea()}
            placeholder="e.g. Cozy cabin weekend in Wisconsin"
            className="h-10 flex-1"
          />
          <Button onClick={addManualIdea} disabled={!manualIdea.trim()} size="icon" className="h-11 w-11 shrink-0">
            <Plus size={16} />
          </Button>
        </div>
      </div>
      {onAddManually && (
        <button
          onClick={onAddManually}
          className="w-full text-xs text-muted-foreground underline-offset-2 hover:underline mt-2"
        >
          or add a trip manually
        </button>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2.5 mt-4">
          {suggestions.map((s, i) => {
            const key = `${s.title}|${s.destination}`;
            const WhoIcon = WHO_ICON[s.who] || Users;
            const isAdded = added[key];
            return (
              <div key={i} className="bg-card rounded-2xl border border-border p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.destination}</p>
                  </div>
                  {isAdded ? (
                    <button
                      onClick={() => onOpenTrip && onOpenTrip(isAdded)}
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-emerald-100 text-emerald-700"
                    >
                      View trip →
                    </button>
                  ) : (
                    <button
                      onClick={() => addSuggestion(s)}
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-primary text-primary-foreground"
                    >
                      <Plus size={12} /> Add
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {s.isManual && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">Your idea</span>}
                  {s.kind && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/30 text-accent-foreground font-medium">{s.kind}</span>}
                  {s.days ? <span className="text-[10px] text-muted-foreground">{s.days} days</span> : null}
                  {s.monthsAhead ? <span className="text-[10px] text-muted-foreground">· in {s.monthsAhead} mo</span> : null}
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <WhoIcon size={11} /> {WHO_LABEL[s.who] || WHO_LABEL.both}
                  </span>
                </div>
                {s.reason && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.reason}</p>}
                {Array.isArray(s.highlights) && s.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {s.highlights.map((h, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-accent">·</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {!isAdded && onReview && (
                  <button
                    onClick={() => onReview({ suggestion: s, context: { tripType, startDate, endDate, invitees } })}
                    className="w-full mt-3 text-xs font-medium px-3 py-2 rounded-full border border-border text-foreground hover:border-primary/50"
                  >
                    Review details
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}