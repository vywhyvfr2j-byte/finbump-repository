import { base44 } from '@/api/base44Client';

// Creates the shared backend Trip record for a trip and emails each invitee
// their private collaboration link. Used by both the AI trip-ideas add and the
// manual add form so a trip is connected to real people and ready to
// collaborate the moment it is created — the same pattern as the dinner planner.
//
// Returns the create-trip-invites result ({ inviteCount, inviteWarning, ... })
// or null when there is nobody to invite. Throws on a server error so the
// caller can toast without blocking the locally-created trip.
export async function sendTripInvites({
  tripId,
  name,
  destination = '',
  startDate = '',
  endDate = '',
  notes = '',
  invitees = [],
}) {
  if (!tripId || !name || !invitees.length) return null;
  const res = await base44.functions.invoke('create-trip-invites', {
    tripId,
    name,
    destination,
    startDate,
    endDate,
    notes,
    invitees,
  });
  const d = res?.data || {};
  if (d.error) throw new Error(d.error);
  return d;
}