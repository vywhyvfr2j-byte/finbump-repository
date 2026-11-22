import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Link2, ShieldCheck } from 'lucide-react';

// The verification step before a meal or trip invitation goes out. It asks the
// server which of the chosen connections can actually be emailed, then waits for
// the host to confirm — so nobody is mailed without the host having seen the list.
export default function InviteVerifyDialog({ open, kind = 'meal', invitees = [], sending, onCancel, onConfirm }) {
  const [checking, setChecking] = useState(false);
  const [rows, setRows] = useState([]);
  const [failed, setFailed] = useState(false);

  const personIds = invitees.map((i) => i.personId).filter(Boolean).sort().join(',');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setChecking(true);
    setFailed(false);
    base44.functions.invoke('verify-invitees', { personIds: personIds ? personIds.split(',') : [] })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data || {};
        if (data.error) throw new Error(data.error);
        setRows(data.invitees || []);
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [open, personIds]);

  // A chosen person the server didn't return (no longer a connection) is shown as
  // link-only, never as someone who will be emailed.
  const listed = invitees.map((i) => rows.find((r) => r.personId === i.personId) || { ...i, willEmail: false });
  const emailed = listed.filter((i) => i.willEmail);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !sending) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-base">
            <ShieldCheck size={17} className="text-primary" /> Check before we send
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          FinBump only emails people in your confirmed connections who have a FinBump account. Everyone else is invited
          with a private link you share yourself.
        </p>

        {checking ? (
          <p className="text-xs text-muted-foreground flex items-center gap-2 py-2">
            <Loader2 size={13} className="animate-spin" /> Checking your connections…
          </p>
        ) : (
          <ul className="space-y-2 py-1">
            {listed.map((i) => (
              <li key={i.personId || i.email} className="flex items-center gap-2 rounded-xl border border-border p-2.5">
                {i.willEmail ? <Mail size={14} className="text-emerald-600 shrink-0" /> : <Link2 size={14} className="text-muted-foreground shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{i.name || i.email}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {i.willEmail ? `We'll email ${i.email}` : "Invited with a private link you'll share"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {failed && (
          <p className="text-xs text-destructive">
            We couldn't check these people just now — sending still only emails your confirmed connections.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} disabled={sending} className="h-11">Cancel</Button>
          <Button onClick={onConfirm} disabled={sending || checking} className="h-11 flex-1">
            {sending ? <Loader2 size={15} className="animate-spin mr-1.5" /> : <Mail size={15} className="mr-1.5" />}
            {sending ? 'Sending…' : emailed.length > 0 ? `Send ${emailed.length} email${emailed.length === 1 ? '' : 's'} & invite` : `Send ${kind} invitations`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}