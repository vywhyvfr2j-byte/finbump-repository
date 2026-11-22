import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Link2, Unlink } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useToast } from '@/components/ui/use-toast';

const CONNECTOR_ID = '6aa9a817babcba65012bc9b7';

export default function GoogleContactsSync() {
  const { reloadPeople } = useKeepsake();
  const { toast } = useToast();
  const [connected, setConnected] = useState(null); // null = checking
  const [googleCount, setGoogleCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [result, setResult] = useState(null);

  const checkConnection = async () => {
    try {
      const res = await base44.functions.invoke('sync-google-contacts', { checkOnly: true });
      if (res.data?.connected === false) {
        setConnected(false);
      } else {
        setConnected(true);
        setGoogleCount(res.data?.totalItems || 0);
      }
    } catch (e) {
      // 402 = not connected; anything else = treat as not connected
      setConnected(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnection();
        }
      }, 600);
    } catch (e) {
      toast({ title: 'Could not start Google connection', description: e?.message });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('sync-google-contacts', {});
      setResult(res.data);
      if (reloadPeople) await reloadPeople();
      toast({
        title: `${res.data.created} added, ${res.data.updated} updated`,
        description: `Checked ${res.data.imported} contacts from Google`,
      });
    } catch (e) {
      toast({ title: 'Sync failed', description: e?.message });
    }
    setSyncing(false);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
      setGoogleCount(0);
      setResult(null);
      toast({ title: 'Google account disconnected' });
    } catch (e) {
      toast({ title: 'Could not disconnect', description: e?.message });
    }
    setDisconnecting(false);
  };

  if (connected === null) {
    return (
      <div className="flex items-center justify-center py-5">
        <Loader2 className="animate-spin text-muted-foreground" size={18} />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Connect your Google account to import contacts — names, birthdays, anniversaries, emails, and phones — into your People list.
        </p>
        <Button onClick={handleConnect} className="w-full h-11 gap-2">
          <Link2 size={16} /> Connect Google Contacts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Google connected — {googleCount > 0 ? `${googleCount} contacts available` : 'ready to sync'}. Syncing adds new contacts and fills in missing birthdays, anniversaries, and phones for existing ones (it never overwrites what you've already entered).
      </p>
      <Button onClick={handleSync} disabled={syncing} className="w-full h-11 gap-2">
        {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
        {syncing ? 'Syncing…' : 'Sync contacts now'}
      </Button>
      {result && (
        <p className="text-xs text-center text-muted-foreground">
          {result.created} added · {result.updated} updated · {result.imported - result.created - result.updated} already here
        </p>
      )}
      <button
        onClick={handleDisconnect}
        disabled={disconnecting}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
      >
        {disconnecting ? <Loader2 className="animate-spin" size={12} /> : <Unlink size={12} />}
        Disconnect Google
      </button>
    </div>
  );
}