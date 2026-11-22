import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { X, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { sortPeopleForPicker } from '@/lib/peopleConstants';

// Normalizes legacy string entries and missing fields so the UI can treat every
// sync request as { personId, requestedAt, verifiedAt }.
const normalize = (r) =>
  typeof r === 'string'
    ? { personId: r, requestedAt: null, verifiedAt: null }
    : { personId: r.personId, requestedAt: r.requestedAt || null, verifiedAt: r.verifiedAt || null };

export default function ConnectionSyncRequests() {
  const { people, syncRequests, requestPersonSync, cancelPersonSyncRequest, verifyPersonSync } = useKeepsake();
  const { toast } = useToast();
  const otherPeople = people.filter((p) => p.relation !== 'partner');

  const [personId, setPersonId] = useState('');
  const [wantsSync, setWantsSync] = useState(false);
  const [viewId, setViewId] = useState('');

  const requests = (syncRequests || []).map(normalize);
  const syncedConnections = requests.filter((r) => people.some((p) => p.id === r.personId));
  const selected = syncedConnections.find((r) => r.personId === viewId);
  const selectedPerson = people.find((p) => p.id === viewId);

  const handleSend = () => {
    requestPersonSync(personId);
    const person = otherPeople.find((p) => p.id === personId);
    toast({ title: 'Sync request sent', description: `${person?.name || 'They'} will be asked to sync.` });
    setPersonId('');
    setWantsSync(false);
  };

  const handleVerify = () => {
    if (!viewId) return;
    verifyPersonSync(viewId);
    const person = people.find((p) => p.id === viewId);
    toast({ title: 'Sync verified', description: `${person?.name || 'Connection'} marked as verified.` });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div>
        <p className="text-sm font-medium">Other connections</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sync with anyone other than your partner only happens when you request it. You can sync with as many connections as you like.
        </p>
      </div>

      <Select value={personId} onValueChange={setPersonId}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Choose a person" />
        </SelectTrigger>
        <SelectContent>
          {sortPeopleForPicker(otherPeople).map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <Checkbox checked={wantsSync} onCheckedChange={(v) => setWantsSync(!!v)} />
        <span className="text-sm">Request sync with this person</span>
      </label>

      <Button onClick={handleSend} disabled={!personId || !wantsSync} className="w-full h-11 rounded-xl">
        Send request
      </Button>

      {syncedConnections.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Synced connections</p>
          <Select value={viewId} onValueChange={setViewId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="View a connection's sync details" />
            </SelectTrigger>
            <SelectContent>
              {syncedConnections.map((r) => {
                const p = people.find((pp) => pp.id === r.personId);
                return (
                  <SelectItem key={r.personId} value={r.personId}>
                    {p?.name || 'Unknown'}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {selected && selectedPerson && (
            <div className="bg-secondary/40 rounded-xl px-3.5 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedPerson.name}</span>
                {selected.verifiedAt ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <ShieldCheck size={14} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Clock size={14} /> Pending
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Requested</span>
                <span className="font-medium">
                  {selected.requestedAt ? format(new Date(selected.requestedAt), 'MMM d, yyyy') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Verified</span>
                <span className="font-medium">
                  {selected.verifiedAt ? format(new Date(selected.verifiedAt), 'MMM d, yyyy') : 'Not yet'}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {!selected.verifiedAt && (
                  <Button onClick={handleVerify} size="sm" className="h-8 rounded-lg flex-1">
                    <CheckCircle2 size={14} /> Mark verified
                  </Button>
                )}
                <Button
                  onClick={() => {
                    cancelPersonSyncRequest(selected.personId);
                    setViewId('');
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg"
                >
                  <X size={14} /> Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {syncedConnections.length === 0 && (
        <p className="text-xs text-muted-foreground">No sync requests yet. Choose a person above to start.</p>
      )}
    </div>
  );
}