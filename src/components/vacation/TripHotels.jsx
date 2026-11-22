import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, BedDouble } from 'lucide-react';

export default function TripHotels({ trip, onAddHotel, onDeleteHotel }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddHotel({
      name: name.trim(),
      address: address.trim(),
      checkIn,
      checkOut,
      confirmation: confirmation.trim(),
      notes: notes.trim(),
    });
    setName('');
    setAddress('');
    setCheckIn('');
    setCheckOut('');
    setConfirmation('');
    setNotes('');
  };

  const hotels = trip.hotels || [];

  return (
    <div>
      <div className="space-y-2 mb-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hotel name" className="h-10" />
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (optional)" className="h-10" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">Check-in</label>
            <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="h-10" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">Check-out</label>
            <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="h-10" />
          </div>
        </div>
        <Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Confirmation code" className="h-10" />
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="h-10" />
        <Button onClick={handleAdd} disabled={!name.trim()} className="w-full h-10">
          Add hotel
        </Button>
      </div>

      <div className="space-y-2.5">
        {hotels.map((h) => (
          <div key={h.id} className="bg-card rounded-2xl border border-border p-3.5 flex gap-3">
            <BedDouble size={16} className="text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{h.name}</p>
                {h.confirmation && (
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">#{h.confirmation}</span>
                )}
              </div>
              {h.address && <p className="text-xs text-muted-foreground mt-0.5">{h.address}</p>}
              {(h.checkIn || h.checkOut) && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {h.checkIn && `Check-in ${h.checkIn}`}
                  {h.checkOut && ` · Check-out ${h.checkOut}`}
                </p>
              )}
              {h.notes && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{h.notes}</p>}
            </div>
            <button onClick={() => onDeleteHotel(h.id)} className="text-muted-foreground shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {hotels.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No hotels added yet.</p>}
      </div>
    </div>
  );
}