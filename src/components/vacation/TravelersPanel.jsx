import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Users, Mail, Copy, Check, Loader2, Send } from 'lucide-react';
import AiTripPlanCard from '@/components/vacation/AiTripPlanCard';
import InviteVerifyDialog from '@/components/invites/InviteVerifyDialog';

// Owner-side collaboration panel for a trip: invite connections to share their
// travel preferences, watch the answers come in, and ask the AI to build one
// plan that fits the whole group. Mirrors the meal planner's collaboration loop.
//
// Self-contained — it talks to the trip backend functions directly rather than
// threading through the keepsake store, so existing single-user trip behavior
// is untouched.

const COMING_LABEL = { yes: "I'm in", maybe: 'Maybe', no: "Can't make it" };

export default function TravelersPanel({ trip, people = [] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [travelers, setTravelers] = useState([]);
  const [aiPlan, setAiPlan] = useState(null);
  const [respondedCount, setRespondedCount] = useState(0);
  const [status, setStatus] = useState('planning');

  const [inviting, setInviting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pickPersonId, setPickPersonId] = useState('');
  const [hostNote, setHostNote] = useState(trip.notes || '');

  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState('');

  const tripId = trip.id;

  const refresh = async () => {
    try {
      const res = await base44.functions.invoke('get-trip-travelers', { tripId });
      const d = res?.data || {};
      if (d.error) throw new Error(d.error);
      setTravelers(d.travelers || []);
      setAiPlan(d.aiPlan || null);
      setRespondedCount(d.respondedCount || 0);
      setStatus(d.status || 'planning');
    } catch (err) {
      // A trip that has never been shared has no backend record yet — that's fine.
      if (err?.response?.status !== 404) {
        console.error('get-trip-travelers failed', err?.message || err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const connectionsWithEmail = people.filter((p) => p.email);

  const pickConnection = (id) => setPickPersonId(id);

  // The verification step: confirm who gets an email before anything is sent.
  const sendInvites = () => {
    const person = people.find((x) => x.id === pickPersonId);
    if (!person?.email) {
      toast({ title: 'Choose someone from your connections' });
      return;
    }
    setVerifying(true);
  };

  const sendInvitesNow = async () => {
    // Invitations go only to a saved connection: their name and email are taken
    // from the contact record, never typed here.
    const person = people.find((x) => x.id === pickPersonId);
    if (!person?.email) {
      setVerifying(false);
      return;
    }
    const invitees = [{
      name: person.preferredName || person.name || '',
      email: person.email,
      personId: person.id,
    }];
    setInviting(true);
    try {
      const res = await base44.functions.invoke('create-trip-invites', {
        tripId,
        name: trip.name,
        destination: trip.destination || '',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        notes: hostNote,
        hostName: user?.full_name || '',
        invitees,
      });
      const d = res?.data || {};
      if (d.error) throw new Error(d.error);
      setPickPersonId('');
      if (d.inviteWarning) toast({ title: 'Invitations saved', description: d.inviteWarning });
      else toast({ title: 'Invitation sent', description: `${d.inviteCount} invited to help plan this trip.` });
      refresh();
    } catch (err) {
      toast({ title: 'Could not send invitations', description: err?.response?.data?.error || err?.message });
    } finally {
      setInviting(false);
      setVerifying(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('suggest-trip-plan', { tripId });
      const d = res?.data || {};
      if (d.error) throw new Error(d.error);
      setAiPlan(d.plan);
      toast({ title: 'Your trip plan is ready' });
      refresh();
    } catch (err) {
      toast({ title: 'Could not build a plan', description: err?.response?.data?.error || err?.message });
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async (t) => {
    const url = `${window.location.origin}/trip-invite?t=${encodeURIComponent(tripId)}&token=${encodeURIComponent(t.token)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(t.token);
      setTimeout(() => setCopiedToken(''), 2000);
    } catch {
      toast({ title: 'Copy failed', description: url });
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <Users size={16} className="text-primary" />
          <p className="font-medium text-sm">Travelers</p>
          {travelers.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {respondedCount}/{travelers.length} answered
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Invite connections to share their dates, destinations, and what they love. FinBump matches everyone's answers into one plan.
        </p>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : travelers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No one invited yet. Add someone below.</p>
        ) : (
          <ul className="space-y-2">
            {travelers.map((t) => {
              const r = t.response || {};
              return (
                <li key={t.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{t.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.respondedAt ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Answered</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Waiting</span>
                      )}
                      <button
                        onClick={() => copyLink(t)}
                        className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-muted-foreground"
                        aria-label={`Copy private link for ${t.name}`}
                      >
                        {copiedToken === t.token ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                  {t.respondedAt && (
                    <div className="mt-2 text-[11px] text-muted-foreground space-y-0.5">
                      {r.coming && <p>RSVP: {COMING_LABEL[r.coming] || r.coming}</p>}
                      {r.dates?.length > 0 && <p>Free: {r.dates.join(', ')}</p>}
                      {r.destinations?.length > 0 && <p>Wants: {r.destinations.join(', ')}</p>}
                      {r.travelStyle?.length > 0 && <p>Style: {r.travelStyle.join(', ')}</p>}
                      {r.budget && <p>Budget: {r.budget}</p>}
                      {r.dietary && <p>Dietary: {r.dietary}</p>}
                      {r.interests?.length > 0 && <p>Loves: {r.interests.join(', ')}</p>}
                      {r.notes && <p className="italic">{r.notes}</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <p className="font-medium text-sm mb-1 flex items-center gap-2"><Mail size={15} className="text-primary" /> Invite someone</p>
        <p className="text-xs text-muted-foreground mb-3">They'll get a private link to share their preferences.</p>
        {connectionsWithEmail.length > 0 ? (
          <div className="mb-3">
            <Select value={pickPersonId} onValueChange={pickConnection}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Pick from your connections" />
              </SelectTrigger>
              <SelectContent>
                {connectionsWithEmail.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">
            Only people in your connections can be invited. Add someone under People first.
          </p>
        )}
        <div className="space-y-2">
          <Textarea
            value={hostNote}
            onChange={(e) => setHostNote(e.target.value)}
            placeholder="A note for your travelers (optional)"
            className="min-h-[60px] text-sm"
          />
        </div>
        <Button onClick={sendInvites} disabled={inviting} className="w-full h-10 mt-2.5">
          {inviting ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Send size={15} className="mr-1.5" />}
          {inviting ? 'Sending…' : 'Send invitation'}
        </Button>
      </div>

      <div className="rounded-2xl border border-border p-4 shadow-card ks-card-tint">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-primary" />
          <p className="font-medium text-sm">AI Trip Plan</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Builds one plan from everyone's answers — destination, day-by-day itinerary, stays, restaurants, and a budget.
        </p>
        <Button onClick={generatePlan} disabled={generating} className="w-full h-11">
          {generating ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Sparkles size={15} className="mr-1.5" />}
          {generating ? 'Building your plan…' : aiPlan ? 'Regenerate plan' : 'Build a plan for everyone'}
        </Button>

        {aiPlan && <div className="mt-4"><AiTripPlanCard aiPlan={aiPlan} /></div>}
      </div>

      <InviteVerifyDialog
        open={verifying}
        kind="trip"
        invitees={(() => {
          const p = people.find((x) => x.id === pickPersonId);
          return p ? [{ personId: p.id, name: p.preferredName || p.name || '', email: p.email || '' }] : [];
        })()}
        sending={inviting}
        onCancel={() => setVerifying(false)}
        onConfirm={sendInvitesNow}
      />
    </div>
  );
}