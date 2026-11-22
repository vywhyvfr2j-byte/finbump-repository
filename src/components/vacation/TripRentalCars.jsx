import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Car } from 'lucide-react';

export default function TripRentalCars({ trip, onAddRentalCar, onDeleteRentalCar }) {
  const [company, setCompany] = useState('');
  const [carType, setCarType] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!company.trim() && !carType.trim()) return;
    onAddRentalCar({
      company: company.trim(),
      carType: carType.trim(),
      pickupLocation: pickupLocation.trim(),
      dropoffLocation: dropoffLocation.trim(),
      pickupDate,
      dropoffDate,
      confirmation: confirmation.trim(),
      notes: notes.trim(),
    });
    setCompany('');
    setCarType('');
    setPickupLocation('');
    setDropoffLocation('');
    setPickupDate('');
    setDropoffDate('');
    setConfirmation('');
    setNotes('');
  };

  const rentalCars = trip.rentalCars || [];

  return (
    <div>
      <div className="space-y-2 mb-4">
        <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Rental company (e.g. Hertz)" className="h-10" />
        <Input value={carType} onChange={(e) => setCarType(e.target.value)} placeholder="Car type (optional)" className="h-10" />
        <Input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="Pickup location" className="h-10" />
        <Input value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} placeholder="Drop-off location (optional)" className="h-10" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">Pickup</label>
            <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="h-10" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">Drop-off</label>
            <Input type="date" value={dropoffDate} onChange={(e) => setDropoffDate(e.target.value)} className="h-10" />
          </div>
        </div>
        <Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Confirmation code" className="h-10" />
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="h-10" />
        <Button onClick={handleAdd} disabled={!company.trim() && !carType.trim()} className="w-full h-10">
          Add rental car
        </Button>
      </div>

      <div className="space-y-2.5">
        {rentalCars.map((r) => (
          <div key={r.id} className="bg-card rounded-2xl border border-border p-3.5 flex gap-3">
            <Car size={16} className="text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{r.company || r.carType || 'Rental car'}</p>
                {r.confirmation && (
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">#{r.confirmation}</span>
                )}
              </div>
              {r.carType && <p className="text-xs text-muted-foreground mt-0.5">{r.carType}</p>}
              {r.pickupLocation && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Pick up: {r.pickupLocation}{r.dropoffLocation && r.dropoffLocation !== r.pickupLocation ? ` · Drop off: ${r.dropoffLocation}` : ''}
                </p>
              )}
              {(r.pickupDate || r.dropoffDate) && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {r.pickupDate && `From ${r.pickupDate}`}
                  {r.dropoffDate && ` · Until ${r.dropoffDate}`}
                </p>
              )}
              {r.notes && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.notes}</p>}
            </div>
            <button onClick={() => onDeleteRentalCar(r.id)} className="text-muted-foreground shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {rentalCars.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No rental cars added yet.</p>}
      </div>
    </div>
  );
}