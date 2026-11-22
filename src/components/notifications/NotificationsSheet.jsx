import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2 } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Button } from '@/components/ui/button';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import NotificationRow from './NotificationRow';
import CareReminderEditSheet from './CareReminderEditSheet';
import ActEditSheet from '@/components/acts/ActEditSheet';
import { useLittleSteps } from '@/hooks/useLittleSteps';

const isActType = (n) => n.type === 'overdue' || n.type === 'due';
const isCareType = (n) => n.type === 'care' || n.type === 'health' || n.type === 'other';
// Which cadences a care notification stands for, so editing/deleting it touches
// only the reminders it was raised for.
const careTypesFor = (n) => {
  if (Array.isArray(n.careTypes) && n.careTypes.length) return n.careTypes;
  if (n.type === 'care') return ['health', 'other'];
  return [n.type];
};

// Bottom-sheet panel listing the in-app notification feed. Each item can be
// deleted (with a confirmation that names what stops being reminded), marked as
// reviewed (crossed out), or edited to change its frequency and contact.
export default function NotificationsSheet() {
  const navigate = useNavigate();
  const {
    notifications, markAllNotificationsRead, markNotificationRead, clearNotifications, dismissNotification,
    acts, people, pets, updateAct, deleteAct, updatePerson, updatePet, dismissMemoryRefresh,
  } = useKeepsake();
  const [editAct, setEditAct] = useState(null);
  const [editCare, setEditCare] = useState(null);
  const { stop: stopLessons } = useLittleSteps();

  const unreadCount = notifications.filter((n) => !n.read && !n.completed).length;
  const allContacts = [...(people || []), ...(pets || [])];
  const findAct = (id) => (acts || []).find((a) => String(a.id) === String(id)) || null;
  const findContact = (id) => allContacts.find((p) => String(p.id) === String(id)) || null;
  const personNameFor = (n) => n.personName || findContact(n.personId)?.name || null;
  const isPet = (id) => (pets || []).some((p) => String(p.id) === String(id));

  const warningFor = (n) => {
    if (isActType(n)) {
      const act = findAct(n.itemId);
      return act
        ? `“${act.name}” will be removed from current and future reminders. The act itself stays in your list.`
        : 'This act will be removed from current and future reminders.';
    }
    if (isCareType(n)) {
      const contact = findContact(n.personId);
      return contact
        ? `Check-in reminders for ${contact.name} will be turned off.`
        : 'These check-in reminders will be turned off.';
    }
    if (n.type === 'little_steps') {
      return 'The Little Steps lessons will stop appearing. You can start them again in Settings.';
    }
    return 'This reminder will be removed from your notifications.';
  };

  const handleDelete = (n) => {
    if (isActType(n)) {
      if (n.itemId) updateAct(n.itemId, { notify: false });
    } else if (isCareType(n)) {
      const patch = {};
      careTypesFor(n).forEach((t) => {
        if (t === 'health') patch.healthReminderDays = 0;
        if (t === 'other') patch.otherReminderDays = 0;
      });
      if (n.personId && Object.keys(patch).length) {
        (isPet(n.personId) ? updatePet : updatePerson)?.(n.personId, patch);
      }
    } else if (n.type === 'memory_refresh' && n.itemId) {
      dismissMemoryRefresh?.(n.itemId);
    } else if (n.type === 'little_steps') {
      stopLessons();
    }
    dismissNotification(n.id);
  };

  const handleEdit = (n) => {
    if (isActType(n)) {
      const act = findAct(n.itemId);
      if (act) setEditAct(act);
    } else if (isCareType(n)) {
      const contact = findContact(n.personId);
      if (contact) setEditCare({ contact, types: careTypesFor(n) });
    }
  };

  const canEdit = (n) => (isActType(n) ? !!findAct(n.itemId) : isCareType(n) ? !!findContact(n.personId) : false);

  const saveCare = (patch) => {
    if (!editCare) return;
    const update = isPet(editCare.contact.id) ? updatePet : updatePerson;
    update?.(editCare.contact.id, patch);
    setEditCare(null);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Notifications</SheetTitle>
      </SheetHeader>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {unreadCount} unread item{unreadCount === 1 ? '' : 's'}
        </p>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={markAllNotificationsRead} className="h-8 text-xs">
            Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={clearNotifications} className="w-11 p-0" aria-label="Clear all notifications">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-2.5 overflow-y-auto pb-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-display text-base">You're all caught up</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              personName={personNameFor(n)}
              deleteWarning={warningFor(n)}
              onOpen={() => {
                markNotificationRead(n.id);
                if (n.route) navigate(n.route);
              }}
              onAcknowledge={() => markNotificationRead(n.id)}
              onDelete={() => handleDelete(n)}
              onEdit={canEdit(n) ? () => handleEdit(n) : null}
            />
          ))
        )}
      </div>

      {editAct && (
        <ActEditSheet
          act={editAct}
          people={people}
          onClose={() => setEditAct(null)}
          onSave={updateAct}
          onDelete={deleteAct}
        />
      )}
      {editCare && (
        <CareReminderEditSheet
          contact={editCare.contact}
          types={editCare.types}
          onClose={() => setEditCare(null)}
          onSave={saveCare}
        />
      )}
    </>
  );
}