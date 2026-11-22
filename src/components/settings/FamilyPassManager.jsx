import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Gift, Ticket, Copy, Share2, Sparkles, Calendar, Wand2 } from 'lucide-react';
import FamilyPassWizard from './FamilyPassWizard';
import { useI18n } from '@/lib/i18n/I18nContext';

// Shown to purchasers who bought a family package. Lets them generate
// shareable annual pass codes and see their remaining credits.
// Also includes a redemption field for recipients who received a code.
export default function FamilyPassManager({ user, onPlanChanged }) {
  const { t } = useI18n();
  const [credits, setCredits] = useState({ annual: user?.passCreditsAnnual || 0 });
  const [label, setLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [lastCode, setLastCode] = useState(null);
  const [issuedCodes, setIssuedCodes] = useState([]);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const { toast } = useToast();

  const refreshCredits = async () => {
    try {
      const me = await base44.auth.me();
      // Available credits are counted from the PassCredit ledger (one row per
      // purchased credit). The ledger is the source of truth so consumption is
      // atomic — the User entity no longer tracks a decrementing counter.
      try {
        const credits = await base44.entities.PassCredit.filter({
          ownerId: me.id, status: 'available',
        });
        const annual = (credits || []).filter((c) => c.passType === 'annual').length;
        setCredits({ annual });
      } catch { /* ignore */ }
      // Load issued codes (purchaser can read their own)
      try {
        const codes = await base44.entities.PassCode.list('-created_date', 50);
        setIssuedCodes(codes || []);
      } catch { /* non-admin/non-purchaser: ignore */ }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    refreshCredits();
    // Trigger an expiry check on mount so an expired monthly pass reverts.
    base44.functions.invoke('redeem-pass-code', {}).catch(() => {});
  }, []);

  const generate = async (passType) => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generate-pass-code', { passType, label });
      const data = res?.data || res;
      if (data?.error) {
        toast({ title: 'Could not generate pass', description: data.error, variant: 'destructive' });
        return;
      }
      setLastCode(data.code);
      setLabel('');
      await refreshCredits();
      toast({ title: 'Pass code created!', description: data.code });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Could not generate pass.';
      toast({ title: 'Could not generate pass', description: msg, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast({ title: 'Copied', description: code });
  };

  const shareCode = (code) => {
    const text = t('app.invitedPremium', { duration: '1 year', code });
    if (navigator.share) {
      navigator.share({ title: t('app.premiumPass'), text }).catch(() => {});
    } else {
      const url = `sms:?&body=${encodeURIComponent(text)}`;
      window.location.href = url;
    }
  };

  const redeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await base44.functions.invoke('redeem-pass-code', { code: redeemCode.trim() });
      const data = res?.data || res;
      if (data?.error) {
        toast({ title: 'Could not redeem', description: data.error, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Premium unlocked!',
        description: data.passType === 'annual' ? t('app.enjoyYear') : t('app.enjoyMonth'),
      });
      setRedeemCode('');
      onPlanChanged?.();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Could not redeem code.';
      toast({ title: 'Could not redeem', description: msg, variant: 'destructive' });
    } finally {
      setRedeeming(false);
    }
  };

  const hasCredits = credits.annual > 0;

  return (
    <div className="space-y-4">
      {/* Redeem a pass */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Ticket size={18} />
          <p className="font-display text-base font-semibold">Redeem a pass</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Received a pass code from someone? Enter it here to unlock Premium.
        </p>
        <div className="flex gap-2">
          <Input
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            placeholder="KS-XXXXXX"
            className="uppercase flex-1"
          />
          <Button onClick={redeem} disabled={redeeming || !redeemCode.trim()} className="shrink-0">
            {redeeming ? 'Redeeming…' : 'Redeem'}
          </Button>
        </div>
      </div>

      {/* Share passes — only for purchasers with credits */}
      {hasCredits && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Gift size={18} />
            <p className="font-display text-base font-semibold">Share your passes</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Generate a code and share it with a friend or family member. They redeem it
            {t('app.inTheirApp')}
          </p>

          <div className="rounded-xl border border-border p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span className="text-xs font-medium">Annual passes</span>
            </div>
            <p className="font-display text-2xl font-semibold">{credits.annual}</p>
            <p className="text-[11px] text-muted-foreground">1-year Premium each</p>
          </div>

          {showWizard ? (
            <FamilyPassWizard
              credits={credits}
              onGenerate={async (passType, wizLabel) => {
                const res = await base44.functions.invoke('generate-pass-code', { passType, label: wizLabel });
                const data = res?.data || res;
                if (data?.error) {
                  toast({ title: 'Could not generate pass', description: data.error, variant: 'destructive' });
                  return null;
                }
                setLastCode(data.code);
                setLabel('');
                setCredits((c) => ({ ...c, [passType === 'annual' ? 'annual' : 'monthly']: data.remaining }));
                await refreshCredits();
                return { code: data.code };
              }}
              onClose={() => setShowWizard(false)}
            />
          ) : (
            <Button onClick={() => setShowWizard(true)} className="w-full h-11 rounded-xl">
              <Wand2 size={16} /> Share a pass — guided
            </Button>
          )}

          {lastCode && !showWizard && (
            <div className="rounded-xl bg-accent/10 border border-accent/30 p-3 space-y-2">
              <p className="text-xs font-medium">Your pass code:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-display text-lg font-semibold tracking-wider">{lastCode}</code>
                <Button size="icon" variant="ghost" onClick={() => copyCode(lastCode)} aria-label="Copy code">
                  <Copy size={16} />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => shareCode(lastCode)} aria-label="Share code">
                  <Share2 size={16} />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Share this code via text or copy it. The recipient enters it in Settings → Plan → Redeem a pass.
              </p>
            </div>
          )}

          {issuedCodes.length > 0 && !showWizard && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-muted-foreground">Issued passes</p>
              {issuedCodes.slice(0, 8).map((pc) => (
                <div key={pc.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="min-w-0">
                    <code className="text-sm font-medium tracking-wide">{pc.code}</code>
                    {pc.label && <span className="text-xs text-muted-foreground ml-2">· {pc.label}</span>}
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                    pc.usedBy ? 'bg-muted text-muted-foreground' : 'bg-accent/20 text-accent-foreground'
                  }`}>
                    {pc.usedBy ? 'Used' : `${pc.passType === 'annual' ? '1 yr' : '1 mo'}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info for non-purchasers */}
      {!hasCredits && (
        <div className="rounded-2xl bg-secondary/40 border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <p className="font-display text-sm font-semibold">Want to share Premium?</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Upgrade to a Family Package to get shareable passes for your friends and family —
            up to 4 annual passes included.
          </p>
        </div>
      )}
    </div>
  );
}