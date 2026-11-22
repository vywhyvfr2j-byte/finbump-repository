import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { FEATURE_FLAGS, APP_VERSION } from '@/lib/appConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Flag, Bell, Tag, Wrench, RefreshCw, Save } from 'lucide-react';

// Admin-only panel for managing the live AppConfig record: feature flags
// (kill switches), server status banner, minimum-version gate, maintenance
// mode, and staged rollout percentage. Changes take effect for all users
// within ~5 minutes (the app polls AppConfig on that cadence).
export default function OpsControlPanel() {
  const { toast } = useToast();
  const [configId, setConfigId] = useState(null);
  const [flags, setFlags] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [statusLevel, setStatusLevel] = useState('info');
  const [minimumVersion, setMinimumVersion] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const configs = await base44.entities.AppConfig.list('-updated_date', 1);
      if (configs.length > 0) {
        const c = configs[0];
        setConfigId(c.id);
        setFlags(c.featureFlags || {});
        setStatusMessage(c.statusMessage || '');
        setStatusLevel(c.statusLevel || 'info');
        setMinimumVersion(c.minimumVersion || '');
        setMaintenanceMode(!!c.maintenanceMode);
        setRolloutPercentage(c.rolloutPercentage != null ? c.rolloutPercentage : 100);
      }
    } catch {
      toast({ title: 'Could not load config', variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        featureFlags: flags,
        statusMessage,
        statusLevel,
        minimumVersion,
        maintenanceMode,
        rolloutPercentage,
      };
      if (configId) {
        await base44.entities.AppConfig.update(configId, payload);
      } else {
        const created = await base44.entities.AppConfig.create(payload);
        setConfigId(created.id);
      }
      toast({ title: 'Config saved', description: 'Changes reach all users within ~5 minutes.' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  const toggleFlag = (key) => {
    setFlags((f) => ({ ...f, [key]: f[key] === false ? true : false }));
  };

  const activeFlags = Object.keys(FEATURE_FLAGS).filter((k) => flags[k] === false);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-primary" />
          <p className="text-sm font-semibold">Ops Control Panel</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Manage live app behavior without an app release. Changes reach all users within ~5 minutes.
          Current build: v{APP_VERSION}
        </p>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            {/* Maintenance mode */}
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Wrench size={15} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Maintenance mode</p>
                  <p className="text-xs text-muted-foreground">Blocks all users with a maintenance screen</p>
                </div>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>

            {/* Status banner */}
            <div className="py-3 border-t border-border space-y-2">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-muted-foreground" />
                <p className="text-sm font-medium">Status banner</p>
              </div>
              <Input
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="e.g. We're aware of an issue with gift syncing, working on it."
                className="h-10"
              />
              <Select value={statusLevel} onValueChange={setStatusLevel}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (blue)</SelectItem>
                  <SelectItem value="warning">Warning (amber)</SelectItem>
                  <SelectItem value="critical">Critical (red)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Minimum version gate */}
            <div className="py-3 border-t border-border space-y-2">
              <div className="flex items-center gap-2">
                <Tag size={15} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Minimum version</p>
                  <p className="text-xs text-muted-foreground">Users below this version see a blocking upgrade screen</p>
                </div>
              </div>
              <Input
                value={minimumVersion}
                onChange={(e) => setMinimumVersion(e.target.value)}
                placeholder="e.g. 1.0.0 (leave empty = no gate)"
                className="h-10"
              />
            </div>

            {/* Staged rollout */}
            <div className="py-3 border-t border-border space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw size={15} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Rollout percentage</p>
                  <p className="text-xs text-muted-foreground">% of users who can access non-core features</p>
                </div>
              </div>
              <Select value={String(rolloutPercentage)} onValueChange={(v) => setRolloutPercentage(Number(v))}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1% — canary</SelectItem>
                  <SelectItem value="10">10% — early</SelectItem>
                  <SelectItem value="50">50% — half</SelectItem>
                  <SelectItem value="100">100% — full</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={save} disabled={saving} className="w-full h-11 rounded-xl mt-2">
              <Save size={15} />
              {saving ? 'Saving…' : 'Save config'}
            </Button>
          </>
        )}
      </div>

      {/* Feature flags / kill switches */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <Flag size={16} className="text-primary" />
          <p className="text-sm font-semibold">Feature flags (kill switches)</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Disable a broken feature in seconds — no app release needed.
          {activeFlags.length > 0 && (
            <span className="text-destructive font-medium"> {activeFlags.length} disabled.</span>
          )}
        </p>
        <div className="divide-y divide-border">
          {Object.entries(FEATURE_FLAGS).map(([key, meta]) => {
            const enabled = flags[key] !== false;
            return (
              <div key={key} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                </div>
                <Switch checked={enabled} onCheckedChange={() => toggleFlag(key)} />
              </div>
            );
          })}
        </div>
        <Button onClick={save} disabled={saving} variant="outline" className="w-full h-10 rounded-xl mt-3">
          <Save size={15} />
          {saving ? 'Saving…' : 'Save flags'}
        </Button>
      </div>
    </div>
  );
}