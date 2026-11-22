import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const PIN_KEY = 'ks_applock_pin_hash';
const ON_KEY = 'ks_applock_on';

async function sha256(s) {
  const buf = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function PrivacyShieldSettings() {
  const { settings, updateSettings } = useKeepsake();
  const [enabling, setEnabling] = useState(false);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [err, setErr] = useState('');

  const enableLock = async () => {
    if (pin1.length !== 4 || pin2.length !== 4) { setErr('Enter a 4-digit PIN.'); return; }
    if (pin1 !== pin2) { setErr('PINs do not match.'); return; }
    const hash = await sha256(pin1);
    localStorage.setItem(PIN_KEY, hash);
    localStorage.setItem(ON_KEY, '1');
    updateSettings({ appLockEnabled: true });
    setEnabling(false);
    setPin1('');
    setPin2('');
    setErr('');
  };

  const disableLock = () => {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(ON_KEY);
    updateSettings({ appLockEnabled: false });
    setEnabling(false);
  };

  return (
    <div className="rounded-2xl bg-card border border-border divide-y divide-border">
      <div className="flex items-start gap-3 p-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary shrink-0">
          <Shield size={16} />
        </div>
        <div>
          <p className="text-sm font-medium">Privacy shield</p>
          <p className="text-xs text-muted-foreground mt-0.5">Blur the app in your recents and lock it with a PIN.</p>
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium">Blur in app switcher</p>
          <p className="text-xs text-muted-foreground mt-0.5">Frost the screen when you swipe away, so no one reads it over your shoulder.</p>
        </div>
        <Switch checked={settings.privacyBlur} onCheckedChange={(v) => updateSettings({ privacyBlur: v })} />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">App lock (PIN)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ask for a 4-digit PIN when you reopen the app.</p>
          </div>
          <Switch
            checked={settings.appLockEnabled}
            onCheckedChange={(v) => { if (v) setEnabling(true); else disableLock(); }}
          />
        </div>
        {enabling && (
          <div className="space-y-2">
            <Input type="password" inputMode="numeric" maxLength={4} value={pin1} onChange={(e) => setPin1(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="New 4-digit PIN" className="h-11" />
            <Input type="password" inputMode="numeric" maxLength={4} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Confirm PIN" className="h-11" />
            {err && <p className="text-xs text-destructive">{err}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11" onClick={() => { setEnabling(false); setPin1(''); setPin2(''); setErr(''); }}>Cancel</Button>
              <Button className="flex-1 h-11" onClick={enableLock}>Save</Button>
            </div>
          </div>
        )}
        {settings.appLockEnabled && !enabling && (
          <Button variant="outline" className="w-full h-10" onClick={() => setEnabling(true)}>Change PIN</Button>
        )}
      </div>
    </div>
  );
}