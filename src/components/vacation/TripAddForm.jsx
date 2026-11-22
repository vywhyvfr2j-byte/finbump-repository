import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TripInvitePicker from '@/components/vacation/TripInvitePicker';
import TripTypePicker from '@/components/vacation/TripTypePicker';

const REMINDER_OPTIONS = [
  { days: 1, label: '1 day before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: '1 week before' },
  { days: 30, label: '1 month before' },
];

export default function TripAddForm({ people, onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [tripType, setTripType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [who, setWho] = useState('both');
  const [invitees, setInvitees] = useState([]);
  const [notes, setNotes] = useState('');
  const [reminderDays, setReminderDays] = useState([7, 1]);

  const toggleReminder = (days) => {
    setReminderDays((prev) => (prev.includes(days) ? prev.filter((d) => d !== days) : [...prev, days]));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const firstConnection = invitees.find((i) => i.personId);
    onAdd({
      name: name.trim(),
      destination: destination.trim(),
      tripType,
      startDate, endDate, who,
      personId: firstConnection?.personId || '',
      invitees,
      notes: notes.trim(),
      reminderDays,
    });
  };

  return (
    <div className="space-y-2 mb-5">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Trip name" className="h-11" autoFocus />
      <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination (optional)" className="h-11" />
      <TripTypePicker value={tripType} onChange={setTripType} />
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="min-h-[80px] resize-none" />
      <Select value={who} onValueChange={setWho}>
        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="both">Me & my partner</SelectItem>
          <SelectItem value="me">Just me</SelectItem>
          <SelectItem value="partner">My partner</SelectItem>
        </SelectContent>
      </Select>
      <TripInvitePicker people={people} invitees={invitees} onChange={setInvitees} />
      <div className="flex gap-2">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 flex-1" />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 flex-1" />
      </div>
      {startDate && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Remind me</p>
          <div className="flex gap-1.5 flex-wrap">
            {REMINDER_OPTIONS.map((r) => (
              <button
                key={r.days}
                onClick={() => toggleReminder(r.days)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  reminderDays.includes(r.days) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <Button onClick={handleSubmit} disabled={!name.trim()} className="w-full h-11">Create trip</Button>
    </div>
  );
}