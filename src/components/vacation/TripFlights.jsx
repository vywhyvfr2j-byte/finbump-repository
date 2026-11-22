import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plane } from 'lucide-react';

export default function TripFlights({ trip, onAddFlight, onDeleteFlight }) {
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [fromAirport, setFromAirport] = useState('');
  const [toAirport, setToAirport] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!airline.trim() && !flightNumber.trim()) return;
    onAddFlight({
      airline: airline.trim(),
      flightNumber: flightNumber.trim(),
      fromAirport: fromAirport.trim(),
      toAirport: toAirport.trim(),
      departureTime,
      arrivalTime,
      confirmation: confirmation.trim(),
      notes: notes.trim(),
    });
    setAirline('');
    setFlightNumber('');
    setFromAirport('');
    setToAirport('');
    setDepartureTime('');
    setArrivalTime('');
    setConfirmation('');
    setNotes('');
  };

  const flights = trip.flights || [];

  return (
    <div>
      <div className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <Input value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Airline" className="h-10" />
          <Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="Flight #" className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input value={fromAirport} onChange={(e) => setFromAirport(e.target.value)} placeholder="From (airport)" className="h-10" />
          <Input value={toAirport} onChange={(e) => setToAirport(e.target.value)} placeholder="To (airport)" className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">Departure</label>
            <Input type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="h-10" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">Arrival</label>
            <Input type="datetime-local" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="h-10" />
          </div>
        </div>
        <Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Confirmation code" className="h-10" />
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="h-10" />
        <Button onClick={handleAdd} disabled={!airline.trim() && !flightNumber.trim()} className="w-full h-10">
          Add flight
        </Button>
      </div>

      <div className="space-y-2.5">
        {flights.map((f) => (
          <div key={f.id} className="bg-card rounded-2xl border border-border p-3.5 flex gap-3">
            <Plane size={16} className="text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {f.airline || 'Flight'}{f.flightNumber && ` ${f.flightNumber}`}
                </p>
                {f.confirmation && (
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">#{f.confirmation}</span>
                )}
              </div>
              {(f.fromAirport || f.toAirport) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {f.fromAirport || '—'} → {f.toAirport || '—'}
                </p>
              )}
              {(f.departureTime || f.arrivalTime) && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {f.departureTime && `Dep ${new Date(f.departureTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`}
                  {f.arrivalTime && ` · Arr ${new Date(f.arrivalTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`}
                </p>
              )}
              {f.notes && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.notes}</p>}
            </div>
            <button onClick={() => onDeleteFlight(f.id)} className="text-muted-foreground shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {flights.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No flights added yet.</p>}
      </div>
    </div>
  );
}