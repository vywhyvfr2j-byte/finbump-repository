import React, { useMemo, useState } from 'react';
import { UserPlus, X } from 'lucide-react';

// Shared "Who's coming?" picker for trip creation — mirrors the dinner
// planner's participants section so adding a trip connects it to your
// connections and invites them to collaborate in the same step. Invitees come
// from your connections only, the same rule the invite function enforces.
export default function TripInvitePicker({ people = [], invitees, onChange }) {
  const suggestions = useMemo(() => {
    const taken = new Set(invitees.map((p) => (p.email || '').toLowerCase()));
    return (people || [])
      .filter((p) => p.email && !taken.has(p.email.toLowerCase()))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [people, invitees]);

  const addConnection = (person) => {
    onChange([...invitees, { name: person.preferredName || person.name, email: person.email, personId: person.id }]);
  };

  const remove = (addr) => onChange(invitees.filter((p) => (p.email || '').toLowerCase() !== addr.toLowerCase()));

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <UserPlus size={13} /> Who's coming? ({invitees.length})
      </p>
      <p className="text-[11px] text-muted-foreground mb-2">
        Add people to invite them and plan together — they'll get a private link to share their dates and ideas.
      </p>
      {invitees.length > 0 && (
        <ul className="space-y-1.5 mb-2.5">
          {invitees.map((p) => (
            <li key={p.email} className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.email}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(p.email)}
                aria-label={`Remove ${p.name}`}
                className="text-muted-foreground hover:text-destructive p-1"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-muted-foreground mb-2">
        Only people in your connections can be invited. Add someone under People first.
      </p>
      {suggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <UserPlus size={13} /> From your connections
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addConnection(p)}
                className="px-3 h-8 rounded-full border border-border text-xs hover:border-primary/50"
              >
                {p.preferredName || p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}