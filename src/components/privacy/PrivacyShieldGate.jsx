import React, { useState, useEffect, useRef } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PIN_KEY = 'ks_applock_pin_hash';
const ON_KEY = 'ks_applock_on';

async function sha256(s) {
  const buf = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function PrivacyShieldGate() {
  const { settings } = useKeepsake();
  const [locked, setLocked] = useState(
    () => localStorage.getItem(ON_KEY) === '1' && !!localStorage.getItem(PIN_KEY)
  );
  const [showBlur, setShowBlur] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const pinHashRef = useRef(null);

  // Keep the gate in sync with the settings toggle.
  useEffect(() => {
    pinHashRef.current = localStorage.getItem(PIN_KEY) || null;
  }, [locked]);

  // Frost the app whenever it is backgrounded, so the recents snapshot is blurred.
  useEffect(() => {
    if (!settings.privacyBlur) { setShowBlur(false); return; }
    const onVis = () => setShowBlur(document.visibilityState === 'hidden');
    const onHide = () => setShowBlur(true);
    const onShow = () => setShowBlur(false);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('blur', onHide);
    window.addEventListener('focus', onShow);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('blur', onHide);
      window.removeEventListener('focus', onShow);
    };
  }, [settings.privacyBlur]);

  // Re-lock when the app is backgrounded then returns, if app lock is on.
  useEffect(() => {
    if (!settings.appLockEnabled) return;
    let bg = false;
    const onVis = () => {
      if (document.visibilityState === 'hidden') bg = true;
      else if (document.visibilityState === 'visible' && bg && pinHashRef.current) {
        setLocked(true);
        bg = false;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [settings.appLockEnabled]);

  const submit = async () => {
    const hash = await sha256(pin);
    if (hash === pinHashRef.current) {
      setLocked(false);
      setPin('');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  if (locked) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-xs text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <Lock size={26} className="text-primary" />
          </div>
          <p className="font-heading text-lg font-semibold mb-1">FinBump is locked</p>
          <p className="text-xs text-muted-foreground mb-4">Enter your 4-digit PIN to open your vault.</p>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            autoFocus
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="••••"
            className="text-center text-2xl tracking-[0.5em] h-14 mb-2"
          />
          {error && <p className="text-xs text-destructive mb-2">Incorrect PIN. Try again.</p>}
          <Button onClick={submit} disabled={pin.length !== 4} className="w-full h-11 rounded-xl">Unlock</Button>
        </div>
      </div>
    );
  }

  if (showBlur) {
    return <div className="fixed inset-0 z-[90] backdrop-blur-xl bg-background/40" aria-hidden="true" />;
  }

  return null;
}