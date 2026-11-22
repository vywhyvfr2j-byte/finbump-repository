import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarPlus, Trash2, Utensils, BedDouble, Palmtree, Car, Sparkle, Loader2 } from 'lucide-react';

// Host-side collaborative reservation list for a trip. Self-contained: it
// reads the shared list from the collaboration backend record and adds/removes
// suggestions through the trip reservation functions, so everything a
// traveler suggests shows up here too.

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

export default function TripReservations({ trip }) {
  const { toast } = useToast();
  const tripId = trip.id;
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [saving, setSaving] = useState(false);

  const [rName, setRName] = useState('');
  const [rType, setRType] = useState('restaurant');
  const [rDateTime, setRDateTime] = useState('');
  const [rParty, setRParty] = useState('');
  const [rLocation, setRLocation] = useState('');
  const [rNotes, setRNotes] = useState('');

  const refresh = async () => {
    try {
      const res = await base44.functions.invoke('get-trip-travelers', { tripId });
      const d = res?.data || {};
      if (d.error) throw new Error(d.error);
      setReservations(d.reservations || []);
    } catch (err) {
      if (err?.response?.status !== 404) {
        // No backend record yet (host hasn't invited anyone) — show an empty
        // list so they can still start collecting suggestions.
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const add = async () => {
    if (!rName.trim()) {
      toast({ title: 'Add a name for the reservation' });
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke('add-trip-reservation', {
        tripId,
        name: trip.name,
        destination: trip.destination || '',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        notes: trip.notes || '',
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
      toast({ title: 'Reservation added to the shared list' });
    } catch (err) {
      toast({ title: 'Could not add reservation', description: err?.response?.data?.error || err?.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      const res = await base44.functions.invoke('remove-trip-reservation', { tripId, reservationId: id });
      const d = res?.data || {};
      if (d.error) throw new Error(d.error);
      setReservations(d.reservations || []);
    } catch (err) {
      toast({ title: 'Could not remove reservation', description: err?.response?.data?.error || err?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <CalendarPlus size={16} className="text-primary" />
          <p className="font-medium text-sm">Reservations</p>
          {reservations.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">{reservations.length} suggested</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          A shared list for you and your travelers to suggest restaurants, activities, and stays. Everyone invited sees the same list.
        </p>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : reservations.length === 0 ? (
          <p className="text-xs text-muted-foreground">No suggestions yet. Add one below, or invite travelers to add theirs.</p>
        ) : (
          <ul className="space-y-2">
            {reservations.map((r) => {
              const Meta = typeMeta(r.type);
              const Icon = Meta.icon;
              return (
                <li key={r.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start gap-2.5">
                    <Icon size={15} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{r.name}</p>
                        <button onClick={() => remove(r.id)} className="text-muted-foreground shrink-0" aria-label="Remove reservation">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {Meta.label}
                        {r.dateTime ? ` · ${r.dateTime}` : ''}
                        {r.partySize ? ` · ${r.partySize} people` : ''}
                      </p>
                      {r.location && <p className="text-[11px] text-muted-foreground">{r.location}</p>}
                      {r.notes && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.notes}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Suggested by {r.byHost ? 'you' : r.suggestedBy}
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
        <Input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Restaurant, tour, hotel…" className="h-10" />
        <Select value={rType} onValueChange={setRType}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input type="datetime-local" value={rDateTime} onChange={(e) => setRDateTime(e.target.value)} className="h-10" />
          <Input type="number" min="1" max="50" value={rParty} onChange={(e) => setRParty(e.target.value)} placeholder="Party size" className="h-10" />
        </div>
        <Input value={rLocation} onChange={(e) => setRLocation(e.target.value)} placeholder="Location or area (optional)" className="h-10" />
        <Textarea value={rNotes} onChange={(e) => setRNotes(e.target.value)} placeholder="Notes for the group (optional)" className="min-h-[56px] text-sm" />
        <Button onClick={add} disabled={saving} className="w-full h-10">
          {saving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <CalendarPlus size={15} className="mr-1.5" />}
          {saving ? 'Adding…' : 'Add to shared list'}
        </Button>
      </div>
    </div>
  );
}