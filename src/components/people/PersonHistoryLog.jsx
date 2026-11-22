import React from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { formatDate } from '@/lib/keepsakeUtils';
import { CalendarCheck, Flag, ChevronRight } from 'lucide-react';

const EVENT_EMOJI = { birthday: '🎂', anniversary: '💍', holiday: '🎉', custom: '📌', trip: '✈️' };

// Per-person completion history log. Derives from each event/milestone's lastCompletedAt
// stamp, so it updates automatically whenever something is marked complete.
//   isPartner=true → partner's events (relation 'partner' or legacy unscoped) + all
//                     relationship milestones.
//   otherwise       → only events tied to this person by personId.
export default function PersonHistoryLog({ personId = null, isPartner = false }) {
  const { events, milestones } = useKeepsake();

  const personEvents = events.filter((e) => {
    if (!e.lastCompletedAt) return false;
    if (isPartner) return e.relation === 'partner' || (!e.personId && !e.relation);
    return String(e.personId) === String(personId);
  });

  const personMilestones = isPartner ? milestones.filter((m) => m.lastCompletedAt) : [];

  const entries = [
    ...personEvents.map((e) => ({
      id: `evt-${e.id}`,
      kind: 'event',
      name: e.name,
      at: e.lastCompletedAt,
      emoji: EVENT_EMOJI[e.type] || '📌',
    })),
    ...personMilestones.map((m) => ({
      id: `ms-${m.id}`,
      kind: 'milestone',
      name: m.title,
      at: m.lastCompletedAt,
      emoji: '🏁',
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  if (!entries.length) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <CalendarCheck size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Completion history</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Nothing marked complete yet. When you mark an event or milestone as complete, it shows up here with the date.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarCheck size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Completion history</h3>
          <span className="text-xs text-muted-foreground">{entries.length}</span>
        </div>
        <Link to="/progress?tab=history" className="flex items-center text-xs text-primary font-medium">
          Full log <ChevronRight size={13} />
        </Link>
      </div>
      <ol className="space-y-2.5">
        {entries.map((en) => (
          <li key={en.id} className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0">
              {en.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{en.name}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                {en.kind === 'milestone' ? <Flag size={10} /> : <CalendarCheck size={10} />}
                Completed {formatDate(en.at)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}