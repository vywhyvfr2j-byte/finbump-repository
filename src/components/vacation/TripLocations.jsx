import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/keepsakeUtils';

export default function TripLocations({ trip, onAddLocation, onDeleteLocation }) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleAdd = () => {
    if (!destination.trim()) return;
    onAddLocation({ destination: destination.trim(), startDate, endDate });
    setDestination('');
    setStartDate('');
    setEndDate('');
  };

  const locations = trip.locations || [];
  const sorted = [...locations].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

  return (
    <div>
      <div className="space-y-2 mb-3">
        <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination (city, region)" className="h-10" />
        <div className="flex gap-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 flex-1" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 flex-1" />
        </div>
        <Button onClick={handleAdd} disabled={!destination.trim()} className="w-full h-10">
          Add location
        </Button>
      </div>

      <div className="space-y-2.5">
        {sorted.map((loc) => (
          <div key={loc.id} className="bg-card rounded-2xl border border-border p-3.5 flex gap-3">
            <MapPin size={16} className="text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{loc.destination}</p>
              {(loc.startDate || loc.endDate) && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {loc.startDate ? formatDate(loc.startDate) : ''}
                  {loc.startDate && loc.endDate ? ' – ' : ''}
                  {loc.endDate ? formatDate(loc.endDate) : ''}
                </p>
              )}
            </div>
            <button onClick={() => onDeleteLocation(loc.id)} className="text-muted-foreground shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No locations added yet.</p>}
      </div>
    </div>
  );
}