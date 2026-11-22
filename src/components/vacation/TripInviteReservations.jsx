import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarPlus, Trash2, Utensils, BedDouble, Palmtree, Car, Sparkle, Loader2 } from 'lucide-react';

// Traveler-side view of a trip's shared reservation list, shown on the public
// invite page. The traveler sees every suggestion (theirs, the host's, and
// other travelers') and can add their own or remove the ones they added.

const TYPES = [
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'activity', label: 'Activity', icon: Palmtree },
  { value: 'stay', label: 'Stay', icon: BedDouble },
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'other', label: 'Other', icon: Sparkle },
];
function typeMeta(type) {
  return TYPES.find((t) => t.value === type) || TYPES[0];
}

export default function TripInviteReservations({ tripId, token, reservations: initial, travelerName }) {
  const [reservations, setReservations] = useState(initial || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [rName, setRName] = useState('');
  const [rType, setRType] = useState('restaurant');
  const [rDateTime, setRDateTime] = useState('');
  const [rParty, setRParty] = useState('');
  const [rLocation, setRLocation] = useState('');
  const [rNotes, setRNotes] = useState('');

  const add = async () => {
    setError('');
    if (!rName.trim()) {
      setError('Add a name for the reservation.');
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke('add-trip-reservation', {
        tripId,
        token,
        reservation: {
          name: rName.trim(),
          type: rType,
          dateTime: rDateTime,
          partySize: rParty ? Number(rParty) : 0,
          location: rLocation.trim(),
          notes: rNotes.trim(),
        },
      });
      const d = res?.data || {};
      if (d.error) throw new Error(d.error);
      setReservations(d.reservations || []);
      setRName(''); setRType('restaurant'); setRDateTime(''); setRParty(''); setRLocation(''); setRNotes('');
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Could not add this reservation.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      const res = await base44.functions.invoke('remove-trip-reservation', { tripId, token, reservationId: id });
      const d = res?.data || {};
      if (d.error) throw new Error(d.error);
      setReservations(d.reservations || []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Could not remove this reservation.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <CalendarPlus size={16} className="text-primary" />
          <p className="font-medium text-sm">Reservation ideas</p>
          {reservations.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">{reservations.length} suggested</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          A shared list everyone invited can see. Add a restaurant, activity, or stay you'd love, and {travelerName ? 'your host' : 'the group'} will see it too.
        </p>
        {reservations.length === 0 ? (
          <p className="text-xs text-muted-foreground">No suggestions yet. Add one below.</p>
        ) : (
          <ul className="space-y-2">
            {reservations.map((r) => {
              const Meta = typeMeta(r.type);
              const Icon = Meta.icon;
              const mine = !r.byHost && r.suggestedBy === travelerName;
              return (
                <li key={r.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start gap-2.5">
                    <Icon size={15} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{r.name}</p>
                        {mine && (
                          <button onClick={() => remove(r.id)} className="text-muted-foreground shrink-0" aria-label="Remove my suggestion">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {Meta.label}
                        {r.dateTime ? ` · ${r.dateTime}` : ''}
                        {r.partySize ? ` · ${r.partySize} people` : ''}
                      </p>
                      {r.location && <p className="text-[11px] text-muted-foreground">{r.location}</p>}
                      {r.notes && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.notes}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Suggested by {r.byHost ? 'your host' : (mine ? 'you' : r.suggestedBy)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-2">
        <p className="font-medium text-sm mb-1">Suggest a reservation</p>
        <Input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Restaurant, tour, hotel…" className="h-11" />
        <Select value={rType} onValueChange={setRType}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input type="datetime-local" value={rDateTime} onChange={(e) => setRDateTime(e.target.value)} className="h-11" />
          <Input type="number" min="1" max="50" value={rParty} onChange={(e) => setRParty(e.target.value)} placeholder="Party size" className="h-11" />
        </div>
        <Input value={rLocation} onChange={(e) => setRLocation(e.target.value)} placeholder="Location or area (optional)" className="h-11" />
        <Textarea value={rNotes} onChange={(e) => setRNotes(e.target.value)} placeholder="Notes (optional)" className="min-h-[56px] text-sm" />
        <Button onClick={add} disabled={saving} className="w-full h-11">
          {saving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <CalendarPlus size={15} className="mr-1.5" />}
          {saving ? 'Adding…' : 'Add my suggestion'}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}