import React from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Switch } from '@/components/ui/switch';
import ActNotificationList from '@/components/notifications/ActNotificationList';
import { sortPeopleForPicker } from '@/lib/peopleConstants';

// Per-item notification controls: lets the user turn notifications on/off for
// individual acts, events, and people. Toggling writes through the existing
// update functions so it persists to the backend. A person flagged off here
// suppresses notifications for every act/event linked to them.
export default function NotificationSettings() {
  const { events, people, updateEvent, updatePerson } = useKeepsake();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">ACTS</p>
        <ActNotificationList />
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">EVENTS</p>
        <div className="rounded-2xl bg-card border border-border divide-y divide-border">
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 p-3">
              <p className="text-sm truncate flex-1">{e.name}</p>
              <Switch checked={e.notify !== false} onCheckedChange={(v) => updateEvent(e.id, { notify: v })} />
            </div>
          ))}
        </div>
      </div>

      {people.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">PEOPLE — Turn off to mute all notifications for a contact</p>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border">
            {sortPeopleForPicker(people).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3">
                <p className="text-sm truncate flex-1">{p.name}</p>
                <Switch checked={p.notify !== false} onCheckedChange={(v) => updatePerson(p.id, { notify: v })} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}