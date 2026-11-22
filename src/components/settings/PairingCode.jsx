import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Link, Loader2, MessageSquare, Unlink } from 'lucide-react';
import ShareConsentDialog from '@/components/settings/ShareConsentDialog';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useI18n } from '@/lib/i18n/I18nContext';
import { generateAccessCode } from '@/lib/accessCode';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function PairingCode() {
  const { t } = useI18n();
  const { unpair } = useKeepsake();
  const { confirm, confirmDialog } = useConfirm();
  const [user, setUser] = useState(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteNote, setInviteNote] = useState('');
  const [unpairing, setUnpairing] = useState(false);
  const { toast } = useToast();

  const loadUser = async () => {
    let me = await base44.auth.me();
    if (!me.pairingCode) {
      me = await base44.auth.updateMe({ pairingCode: generateAccessCode() });
    }
    setUser(me);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.pairingCode || '');
    toast({ title: 'Code copied!' });
  };

  const handleApprovePairing = async (sharingExclusions) => {
    setConnecting(true);
    await base44.auth.updateMe({ sharingExclusions });
    let res;
    try {
      res = await base44.functions.invoke('connectPairing', { code: enteredCode.trim() });
    } catch (err) {
      setConnecting(false);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Pairing failed. Please try again.';
      toast({ title: 'Could not pair', description: message, variant: 'destructive' });
      loadUser();
      return;
    }
    setConnecting(false);
    if (res?.data?.error) {
      toast({ title: 'Could not pair', description: res.data.error, variant: 'destructive' });
      loadUser();
      return;
    }
    setShowConsent(false);
    toast({ title: 'Paired!', description: `You're now connected with ${res.data.partnerName}.` });
    setEnteredCode('');
    loadUser();
  };

  const handleSendInvite = () => {
    const code = user?.pairingCode || '';
    const appUrl = window.location.origin;
    const note = inviteNote.trim() ? `\n${inviteNote.trim()}` : '';
    const message = t('app.stayConnected', { code, url: appUrl + note });
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
    const a = document.createElement('a');
    a.href = smsUrl;
    a.click();
  };

  const handleUnpair = async () => {
    const answer = await confirm({
      title: 'Unpair with your partner?',
      description: 'You will need a new code to reconnect.',
      confirmLabel: 'Unpair',
    });
    if (!answer) return;
    setUnpairing(true);
    await unpair();
    setUnpairing(false);
    loadUser();
  };

  if (!user) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Pairing code</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {user.partnerUserId
            ? 'You are paired. Shared data syncs automatically.'
            : "Share this code with your partner to sync"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 bg-secondary/60 rounded-xl px-4 py-3">
        <span className="font-display text-xl tracking-[0.3em] font-semibold">{user.pairingCode}</span>
        <button onClick={handleCopy} className="text-primary shrink-0" aria-label="Copy code">
          <Copy size={18} />
        </button>
      </div>

      {!user.partnerUserId ? (
        <>
          <div className="flex gap-2">
            <Input
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
              placeholder="Enter partner's code"
              className="h-11"
              maxLength={6}
            />
            <Button
              variant="outline"
              onClick={() => setShowConsent(true)}
              disabled={!enteredCode.trim() || connecting}
              className="h-11 shrink-0 gap-1.5"
            >
              {connecting ? <Loader2 size={15} className="animate-spin" /> : <Link size={15} />} Connect
            </Button>
          </div>

          {showInvite ? (
            <div className="space-y-2">
              <Textarea
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
                placeholder="Add a personal note (optional)"
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowInvite(false)} className="h-10 flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSendInvite} className="h-10 flex-1 gap-1.5">
                  <MessageSquare size={15} /> Send via text
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
            >
              <MessageSquare size={15} /> Send invite via text
            </button>
          )}
        </>
      ) : (
        <button
          onClick={handleUnpair}
          disabled={unpairing}
          className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl text-sm font-medium text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          {unpairing ? <Loader2 size={15} className="animate-spin" /> : <Unlink size={15} />}
          Unpair
        </button>
      )}

      <ShareConsentDialog
        open={showConsent}
        onClose={() => setShowConsent(false)}
        onApprove={handleApprovePairing}
        submitting={connecting}
      />
      {confirmDialog}
    </div>
  );
}