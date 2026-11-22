import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BrandLogo from '@/components/BrandLogo';
import { useToast } from '@/components/ui/use-toast';
import { openCheckoutUrl } from '@/lib/openCheckoutUrl';
import { Crown, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';

// The recommended plan the trial starts on. Every plan is available one tap
// away on the plans screen.
const TRIAL_PLAN = 'keepsake-premium-yearly';

// Shown to a signed-in member who has not started a trial or paid for a plan.
// Two ways in: the 7-day free trial (card on file, no charge today) or paying
// for a plan now. Signing up alone no longer unlocks the app.
export default function AccessGate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [starting, setStarting] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const startTrial = async () => {
    setStarting(true);
    try {
      const res = await base44.functions.invoke('create-checkout', { productId: TRIAL_PLAN });
      const redirectUrl = res?.data?.redirectUrl || res?.redirectUrl;
      if (redirectUrl) {
        openCheckoutUrl(redirectUrl);
        return;
      }
      toast({ title: 'Could not start checkout', variant: 'destructive' });
    } catch {
      toast({ title: 'Checkout failed', variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('validate-access-code', { code: code.trim() });
      if (res?.data?.error) {
        toast({ title: 'Access denied', description: res.data.error, variant: 'destructive' });
        return;
      }
      window.location.reload();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Could not validate code.';
      toast({ title: 'Access denied', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo size={56} />
          <h1 className="font-display text-2xl font-semibold">Welcome to FinBump</h1>
          <p className="text-sm text-muted-foreground">
            Start your 7-day free trial, or pay for a plan now. You are not charged today.
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/15 text-accent">
              <Crown size={18} />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-none">7-day free trial</p>
              <p className="text-[11px] text-muted-foreground mt-1">Every Premium feature unlocked</p>
            </div>
          </div>

          <Button onClick={startTrial} disabled={starting} className="w-full h-12 rounded-xl">
            {starting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opening secure checkout…
              </>
            ) : (
              'Start my 7-day free trial'
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center leading-snug">
            A card is required. $18.99/year after your trial, and you can cancel any time before
            day 8 with no charge.
          </p>

          <Button
            variant="outline"
            onClick={() => navigate('/paywall?payNow=1')}
            className="w-full h-11 rounded-xl"
          >
            Choose a plan and pay now
            <ChevronRight size={14} />
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-3">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-[11px] text-muted-foreground leading-snug">
            Payment is handled by Base44 Payments. Your card details never touch FinBump.
          </p>
        </div>

        {showCode ? (
          <form onSubmit={submitCode} className="space-y-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ACCESS CODE"
              className="h-11 text-center text-base tracking-widest rounded-xl"
              autoCapitalize="characters"
              autoCorrect="off"
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCode(false)} className="flex-1 h-10">
                Back
              </Button>
              <Button type="submit" disabled={loading || !code.trim()} className="flex-1 h-10">
                {loading ? 'Checking…' : 'Unlock access'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-1">
            <button
              type="button"
              onClick={() => setShowCode(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              I have an access code
            </button>
            <p className="text-[11px] text-muted-foreground">
              Already subscribed?{' '}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-primary font-medium hover:underline"
              >
                Refresh access
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}