import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { sendTripInvites } from '@/lib/tripInvite';
import { readTripIdeaState, writeTripIdeaState } from '@/lib/tripIdeaStorage';
import { Plus, MapPin, CalendarDays, Users, Sparkles, Clock, Compass } from 'lucide-react';

const WHO_LABEL = { me: 'Just me', partner: 'My partner', both: 'Me & my partner' };

// A separate, full page for reviewing an AI trip idea before committing it.
// The idea and the user's current AI-card selections (trip types, travel
// window, invitees) are passed in via router state, so this page never touches
// the planner's own state — the planner stays exactly as the user left it.
export default function TripIdeaReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTrip, addEvent } = useKeepsake();
  const { toast } = useToast();

  const suggestion = location.state?.suggestion;
  const context = location.state?.context || {};

  if (!suggestion) {
    return (
      <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
        <TopNav title="Trip idea" backTo="/vacation-planner" />
        <div className="px-5 py-16 text-center text-sm text-muted-foreground">
          This trip idea is no longer available. Return to the planner to search again.
        </div>
        <div className="px-5">
          <Button onClick={() => navigate('/vacation-planner')} variant="outline" className="w-full h-11">
            Back to planner
          </Button>
        </div>
      </div>
    );
  }

  const who = ['me', 'partner', 'both'].includes(suggestion.who) ? suggestion.who : 'both';
  const tripTypes = (context.tripType || '').split(',').map((s) => s.trim()).filter(Boolean);
  const invitees = Array.isArray(context.invitees) ? context.invitees : [];

  const addTripNow = async () => {
    let tripStart = context.startDate || '';
    let tripEnd = context.endDate || '';
    if (!tripStart) {
      const now = new Date();
      const months = Number(suggestion.monthsAhead) || 0;
      const days = Number(suggestion.days) || 0;
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
      name: suggestion.title,
      destination: suggestion.destination,
      startDate: tripStart,
      endDate: tripEnd,
      who,
      tripType: context.tripType || '',
      personId: firstConnection?.personId || '',
    });
    if (tripStart) {
      addEvent({
        name: `${suggestion.title} trip`,
        date: new Date(tripStart).toISOString(),
        type: 'trip',
        note: suggestion.destination ? `Trip to ${suggestion.destination}` : '',
        reminderDays: [7, 1],
        tripId,
      });
    }
    // Mark this idea as added in the shared AI-card state, so when the planner
    // remounts it shows "View trip" instead of "Add" for this suggestion.
    const prev = readTripIdeaState() || {};
    writeTripIdeaState({
      added: { ...(prev.added || {}), [`${suggestion.title}|${suggestion.destination}`]: tripId },
    });

    if (invitees.length > 0) {
      try {
        const r = await sendTripInvites({
          tripId,
          name: suggestion.title,
          destination: suggestion.destination || '',
          startDate: tripStart,
          endDate: tripEnd,
          invitees,
        });
        toast({ title: 'Trip created', description: r?.inviteCount ? `Invitations sent to ${r.inviteCount}.` : 'Invitations sent.' });
      } catch (err) {
        toast({ title: 'Trip created', description: err?.message || 'Open the trip to invite your travelers.' });
      }
    } else {
      toast({ title: 'Trip created' });
    }
    navigate('/vacation-planner');
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title="Review trip idea" backTo="/vacation-planner" />
      <div className="px-5 mt-2 space-y-4">
        {/* Idea header */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Compass size={18} className="text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg font-semibold leading-tight">{suggestion.title}</h2>
              {suggestion.destination && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin size={13} /> {suggestion.destination}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-3">
            {suggestion.kind && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-accent/30 text-accent-foreground font-medium">
                {suggestion.kind}
              </span>
            )}
            {suggestion.days ? (
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Clock size={12} /> {suggestion.days} days
              </span>
            ) : null}
            {suggestion.monthsAhead ? (
              <span className="text-[11px] text-muted-foreground">· in {suggestion.monthsAhead} mo</span>
            ) : null}
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Users size={12} /> {WHO_LABEL[who] || WHO_LABEL.both}
            </span>
          </div>

          {suggestion.reason && (
            <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{suggestion.reason}</p>
          )}

          {Array.isArray(suggestion.highlights) && suggestion.highlights.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} /> Highlights
              </p>
              <ul className="space-y-1">
                {suggestion.highlights.map((h, idx) => (
                  <li key={idx} className="text-sm text-foreground/80 flex gap-2">
                    <span className="text-accent">·</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Your plan selections carried over from the AI card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your plan</p>
          <div className="flex items-start gap-2.5">
            <CalendarDays size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Travel window</p>
              <p className="text-muted-foreground">
                {context.startDate && context.endDate
                  ? `${context.startDate} → ${context.endDate}`
                  : context.startDate
                    ? `From ${context.startDate}`
                    : 'Not set — the AI will estimate dates'}
              </p>
            </div>
          </div>
          {tripTypes.length > 0 && (
            <div className="flex items-start gap-2.5">
              <Compass size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm flex-1">
                <p className="font-medium">Trip types</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {tripTypes.map((tp) => (
                    <span key={tp} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/40 text-secondary-foreground font-medium">
                      {tp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2.5">
            <Users size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Travelers ({invitees.length})</p>
              {invitees.length > 0 ? (
                <p className="text-muted-foreground truncate">{invitees.map((i) => i.name).join(', ')}</p>
              ) : (
                <p className="text-muted-foreground">Just you — add travelers from the planner</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={addTripNow} className="flex-1 h-11">
            <Plus size={16} /> Add this trip
          </Button>
          <Button variant="outline" onClick={() => navigate('/vacation-planner')} className="h-11">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}