import React from 'react';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, Link2, Pencil } from 'lucide-react';

// Shows + toggles whether a trip is shared with the paired partner so both can
// view and edit it together. For trips shared *by* the partner, the toggle is
// read-only (the owner controls sharing); the partner can still edit the trip.
export default function TripShareToggle({ trip, partnerName, editable = true, onToggle }) {
  const shared = !!trip.sharedWithPartner;
  const fromPartner = !!trip._fromPartner;

  return (
    <div className="flex items-center justify-between bg-card rounded-2xl border border-border px-4 py-3 mb-4">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${shared ? 'bg-primary/10' : 'bg-muted'}`}>
          {shared ? <ShieldCheck size={16} className="text-primary" /> : <Link2 size={16} className="text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {fromPartner ? `Shared by ${partnerName || 'partner'}` : `Share with ${partnerName || 'partner'}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            {shared ? (
              <>
                <Pencil size={11} /> {fromPartner ? 'You can view & edit this trip' : 'You can both view & edit this trip'}
              </>
            ) : (
              'Only you can see this trip'
            )}
          </p>
        </div>
      </div>
      {editable && <Switch checked={shared} onCheckedChange={onToggle} aria-label="Share trip with partner" />}
    </div>
  );
}