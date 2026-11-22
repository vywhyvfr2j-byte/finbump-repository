import React from 'react';
import TripRow, { tripStatus } from '@/components/vacation/TripRow';

const sortTrips = (trips) => {
  const upcoming = trips.filter((t) => t.startDate && tripStatus(t).kind !== 'past').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const nodate = trips.filter((t) => !t.startDate);
  const past = trips.filter((t) => t.startDate && tripStatus(t).kind === 'past').sort((a, b) => (b.endDate || b.startDate).localeCompare(a.endDate || a.startDate));
  return { upcoming, nodate, past };
};

export default function TripList({ trips, people, onOpen, onDelete }) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-medium">No trips planned yet</p>
        <p className="text-sm mt-1">Tap + to add an upcoming trip and track it here.</p>
      </div>
    );
  }

  const { upcoming, nodate, past } = sortTrips(trips);
  const linkedName = (trip) => people.find((p) => p.id === trip.personId)?.name;

  return (
    <>
      {upcoming.length > 0 && (
        <div className="space-y-2.5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</p>
          {upcoming.map((trip) => (
            <TripRow key={trip.id} trip={trip} onOpen={onOpen} onDelete={onDelete} linkedPerson={linkedName(trip)} />
          ))}
        </div>
      )}
      {nodate.length > 0 && (
        <div className="space-y-2.5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ideas (no date yet)</p>
          {nodate.map((trip) => (
            <TripRow key={trip.id} trip={trip} onOpen={onOpen} onDelete={onDelete} linkedPerson={linkedName(trip)} />
          ))}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-2.5 opacity-70">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Past trips</p>
          {past.map((trip) => (
            <TripRow key={trip.id} trip={trip} onOpen={onOpen} onDelete={onDelete} linkedPerson={linkedName(trip)} />
          ))}
        </div>
      )}
    </>
  );
}