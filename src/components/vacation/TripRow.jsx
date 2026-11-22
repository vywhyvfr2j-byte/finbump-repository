import React from 'react';
import { Plane, Trash2, User, Heart, Users, ShieldCheck } from 'lucide-react';

const WHO_LABEL = { me: 'Just me', partner: 'My partner', both: 'Me & my partner' };
const WHO_ICON = { me: User, partner: Heart, both: Users };

// Status + countdown badge for an upcoming/past trip.
export function tripStatus(trip) {
  const start = trip?.startDate;
  const end = trip?.endDate;
  if (!start) return { kind: 'tbd', label: 'No date set', tone: 'muted' };
  const startMs = Date.parse(start.slice(0, 10) + 'T00:00:00');
  const endMs = end ? Date.parse(end.slice(0, 10) + 'T23:59:59') : startMs;
  const now = Date.now();
  if (now < startMs) {
    const days = Math.round((startMs - now) / 86400000);
    const label = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} ${days === 1 ? 'day' : 'days'}`;
    return { kind: 'upcoming', label, tone: days <= 3 ? 'soon' : 'upcoming' };
  }
  if (now > endMs) return { kind: 'past', label: 'Past', tone: 'past' };
  return { kind: 'ongoing', label: 'In progress', tone: 'ongoing' };
}

const TONE_CLASS = {
  muted: 'bg-muted text-muted-foreground',
  soon: 'bg-accent/20 text-accent-foreground font-semibold',
  upcoming: 'bg-primary/10 text-primary',
  ongoing: 'bg-emerald-100 text-emerald-700 font-semibold',
  past: 'bg-muted text-muted-foreground/70',
};

export default function TripRow({ trip, onOpen, onDelete, linkedPerson }) {
  const who = trip.who || 'both';
  const WhoIcon = WHO_ICON[who] || Users;
  const status = tripStatus(trip);
  const totalBudget = (trip.categories || []).reduce((sum, c) => sum + (c.limit || 0), 0);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onOpen(trip);
      }}
      className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 text-left"
    >
      <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
        <Plane size={18} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{trip.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {trip.destination || 'No destination set'}
          {trip.tripType && ` · ${trip.tripType}`}
          {(trip.startDate || trip.endDate) && ` · ${trip.startDate || ''}${trip.endDate ? ` → ${trip.endDate}` : ''}`}
          {totalBudget > 0 && ` · Budget $${totalBudget}`}
        </p>
        {trip.notes && <p className="text-xs text-muted-foreground/80 mt-0.5 line-clamp-1">{trip.notes}</p>}
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
          <WhoIcon size={11} /> {WHO_LABEL[who]}
          {linkedPerson && (
            <span className="inline-flex items-center gap-0.5 ml-1.5">
              · {linkedPerson}
            </span>
          )}
          {trip.sharedWithPartner && (
            <span className="inline-flex items-center gap-0.5 text-primary ml-1.5">
              <ShieldCheck size={11} /> Shared
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${TONE_CLASS[status.tone]}`}>{status.label}</span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onDelete(trip.id);
          }}
          className="text-muted-foreground"
        >
          <Trash2 size={16} />
        </span>
      </div>
    </button>
  );
}