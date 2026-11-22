import React, { useState, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { base44 } from '@/api/base44Client';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildDigest } from '@/lib/buildDigest';
import { useToast } from '@/components/ui/use-toast';
import PartnerSyncOptions from '@/components/settings/PartnerSyncOptions';
import FriendConnections from '@/components/settings/FriendConnections';
import AccountDeletion from '@/components/settings/AccountDeletion';
import SubscribePremium from '@/components/settings/SubscribePremium';
import SettingsLegal from '@/components/settings/SettingsLegal';
import DataExport from '@/components/settings/DataExport';
import ContactForm from '@/components/settings/ContactForm';
import ThemePicker from '@/components/settings/ThemePicker';
import AccessibilitySettings from '@/components/settings/AccessibilitySettings';
import LanguageSelector from '@/components/settings/LanguageSelector';
import AccessCodeManager from '@/components/settings/AccessCodeManager';
import CancelRequestManager from '@/components/settings/CancelRequestManager';
import AffiliateLinkManager from '@/components/settings/AffiliateLinkManager';
import SuggestionManager from '@/components/settings/SuggestionManager';
import OpsControlPanel from '@/components/settings/OpsControlPanel';
import CalendarImport from '@/components/settings/CalendarImport';
import PrivacyShieldSettings from '@/components/settings/PrivacyShieldSettings';
import StoryCategoryPicker from '@/components/settings/StoryCategoryPicker';
import { BarChart3, Plus, ShieldCheck } from 'lucide-react';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import EveningReminderSetting from '@/components/settings/EveningReminderSetting';
import QuietHoursSetting from '@/components/settings/QuietHoursSetting';
import LittleStepsSettings from '@/components/settings/LittleStepsSettings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function Settings() {
  const { t } = useI18n();
  const { settings, updateSettings, myPreferences, updateMyPreferences, acts, events, giftIdeas } = useKeepsake();
  const [draft, setDraft] = useState(settings);
  const [sending, setSending] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { toast } = useToast();
  const CADENCE_OPTIONS = [
    { value: 'weekly', label: t('settings.weekly') },
    { value: 'monthly', label: t('settings.monthly') },
  ];

  useEffect(() => setDraft(settings), [settings]);

  // Name and email must always reflect the real account owner — never a freely
  // editable value — so a paired partner can't be misled about who they're sharing with.
  useEffect(() => {
    base44.auth.me().then((user) => {
      setUserRole(user.role);
      const accountInfo = { preferredName: user.full_name || '', email: user.email || '' };
      setDraft((d) => ({ ...d, ...accountInfo }));
      updateSettings(accountInfo);
    });
  }, []);

  const handleSendDigest = async () => {
    if (!draft.email) {
      toast({ title: t('settings.addEmailFirst'), variant: 'destructive' });
      return;
    }
    setSending(true);
    const { subject, body } = buildDigest({ acts, events, giftIdeas, cadence: draft.digestCadence });
    await base44.functions.invoke('send-digest-now', { email: draft.email, subject, body });
    setSending(false);
    toast({ title: t('settings.digestSent'), description: t('settings.checkEmail', { email: draft.email }) });
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="px-5 mt-2">
        <Tabs defaultValue="account">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="account" className="text-xs px-1">{t('settings.tab.account')}</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs px-1">{t('settings.tab.alerts')}</TabsTrigger>
            <TabsTrigger value="daily" className="text-xs px-1">{t('settings.tab.daily')}</TabsTrigger>
            <TabsTrigger value="sync" className="text-xs px-1">{t('settings.tab.sync')}</TabsTrigger>
            <TabsTrigger value="plan" className="text-xs px-1">{t('settings.tab.plan')}</TabsTrigger>
          </TabsList>

          {/* Account — identity, personalization, legal, support */}
          <TabsContent value="account" className="space-y-5 mt-0">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('settings.name')}</label>
              <Input value={draft.preferredName} disabled aria-label={t('settings.name')} className="h-11" />
              <p className="text-[11px] text-muted-foreground mt-1">{t('settings.nameHint')}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('settings.email')}</label>
              <Input type="email" value={draft.email} disabled aria-label={t('settings.email')} className="h-11" />
              <p className="text-[11px] text-muted-foreground mt-1">{t('settings.emailHint')}</p>
            </div>

            <LittleStepsSettings />
            <ThemePicker />
            <AccessibilitySettings />
            <PrivacyShieldSettings />
            <LanguageSelector />
            {/* The second step at sign-in lives on its own page, which asks for
                a fresh sign-in before it shows or changes anything. */}
            <Link
              to="/mfa"
              className="flex items-center justify-between rounded-2xl bg-card border border-border p-4 hover:bg-secondary/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add a second step at sign-in — an authenticator app or a code sent to your phone.
                  </p>
                </div>
              </div>
            </Link>
            <ContactForm />
            <SettingsLegal />
            <DataExport />
            <AccountDeletion />
          </TabsContent>

          {/* Alerts — all notification and digest preferences */}
          <TabsContent value="alerts" className="space-y-5 mt-0">
            <div className="rounded-2xl bg-card border border-border divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{t('settings.actReminders')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.actRemindersHint')}</p>
                </div>
                <Switch
                  checked={draft.notifyScheduledActs}
                  onCheckedChange={(v) => {
                    setDraft((d) => ({ ...d, notifyScheduledActs: v }));
                    updateSettings({ notifyScheduledActs: v });
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{t('settings.overdueReminders')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.overdueRemindersHint')}</p>
                </div>
                <Switch
                  checked={draft.notifyOverdue}
                  onCheckedChange={(v) => {
                    setDraft((d) => ({ ...d, notifyOverdue: v }));
                    updateSettings({ notifyOverdue: v });
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{t('settings.upcomingDateAlerts')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.upcomingDateAlertsHint')}</p>
                </div>
                <Switch
                  checked={draft.notifyEvents}
                  onCheckedChange={(v) => {
                    setDraft((d) => ({ ...d, notifyEvents: v }));
                    updateSettings({ notifyEvents: v });
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{t('settings.dailyPush')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.dailyPushHint')}</p>
                </div>
                <Switch
                  checked={myPreferences.pushNotifications !== false}
                  onCheckedChange={(v) => updateMyPreferences({ pushNotifications: v })}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{t('settings.habitNudge')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.habitNudgeHint')}</p>
                </div>
                <Switch
                  checked={myPreferences.habitNudge !== false}
                  onCheckedChange={(v) => updateMyPreferences({ habitNudge: v })}
                />
              </div>
            </div>

            <EveningReminderSetting />

            <QuietHoursSetting />

            <div className="space-y-2">
              <p className="text-sm font-medium">{t('settings.perItemNotifications')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.perItemNotificationsHint')}</p>
              <NotificationSettings />
            </div>

            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">{t('settings.digestEmails')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('settings.digestEmailsHint')}
                </p>
              </div>
              <Select value={draft.digestCadence} onValueChange={(v) => {
                setDraft((d) => ({ ...d, digestCadence: v }));
                updateSettings({ digestCadence: v });
              }}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CADENCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSendDigest} disabled={sending} className="w-full h-11 rounded-xl">
                {sending ? t('settings.sending') : t('settings.sendDigestNow')}
              </Button>
            </div>
          </TabsContent>

          {/* Daily — care & prayer, encouragement, and faith */}
          <TabsContent value="daily" className="space-y-5 mt-0">
            <Link
              to="/prayer"
              className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4 hover:bg-secondary/60 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/15 text-accent-foreground shrink-0">
                <Heart size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t('settings.carePrayer')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('settings.carePrayerDesc')}</p>
              </div>
            </Link>

            <div className="rounded-2xl bg-card border border-border divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{t('settings.dailyEncouragement')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.dailyEncouragementDesc')}</p>
                </div>
                <Switch
                  checked={draft.dailyEncouragement}
                  onCheckedChange={(v) => {
                    setDraft((d) => ({ ...d, dailyEncouragement: v }));
                    updateSettings({ dailyEncouragement: v });
                  }}
                />
              </div>
              {draft.dailyEncouragement && (
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium">{t('settings.whichItems')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('settings.whichItemsDesc')}</p>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm">{t('settings.shortStory')}</span>
                        <Switch
                          checked={draft.encouragementStory !== false}
                          onCheckedChange={(v) => {
                            setDraft((d) => ({ ...d, encouragementStory: v }));
                            updateSettings({ encouragementStory: v });
                          }}
                        />
                      </div>
                      {draft.encouragementStory !== false && (
                        <div className="pt-1 pb-1">
                          <p className="text-sm font-medium">Story categories</p>
                          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                            Choose which kinds of true stories appear. Each category is deduped so a story never repeats within the year.
                          </p>
                          <StoryCategoryPicker
                            value={draft.storyCategories || []}
                            onChange={(cats) => {
                              setDraft((d) => ({ ...d, storyCategories: cats }));
                              updateSettings({ storyCategories: cats });
                            }}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm">{t('settings.encouragement')}</span>
                        <Switch
                          checked={draft.encouragementMessage !== false}
                          onCheckedChange={(v) => {
                            setDraft((d) => ({ ...d, encouragementMessage: v }));
                            updateSettings({ encouragementMessage: v });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm">{t('settings.dailyScripture')}</span>
                        <Switch
                          checked={draft.encouragementScripture !== false}
                          onCheckedChange={(v) => {
                            setDraft((d) => ({ ...d, encouragementScripture: v }));
                            updateSettings({ encouragementScripture: v });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <p className="text-sm font-medium">{t('settings.faithTradition')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('settings.faithTraditionDesc')}</p>
                  </div>
                  <Select
                    value={draft.faithTradition || 'none'}
                    onValueChange={(v) => {
                      const val = v === 'none' ? '' : v;
                      setDraft((d) => ({ ...d, faithTradition: val }));
                      updateSettings({ faithTradition: val });
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="christian">Christian</SelectItem>
                      <SelectItem value="jewish">Jewish</SelectItem>
                      <SelectItem value="muslim">Muslim</SelectItem>
                      <SelectItem value="hindu">Hindu</SelectItem>
                      <SelectItem value="buddhist">Buddhist</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {draft.faithTradition === 'other' && (
                    <Input
                      value={draft.faithTraditionOther || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, faithTraditionOther: e.target.value }))}
                      onBlur={(e) => updateSettings({ faithTraditionOther: e.target.value })}
                      placeholder="Your specific tradition (e.g. Bahá'í, Sikh, Wiccan)"
                      aria-label="Your specific faith tradition"
                      className="h-11 mt-2"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">{t('settings.scriptureTopic')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('settings.scriptureTopicDesc')}</p>
                    <Input
                      value={draft.scriptureSubject || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, scriptureSubject: e.target.value }))}
                      onBlur={(e) => updateSettings({ scriptureSubject: e.target.value })}
                      placeholder={t('settings.scripturePlaceholder')}
                      className="h-11 mt-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Sync — partner label, pairing, and friend connections */}
          <TabsContent value="sync" className="space-y-5 mt-0">
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">{t('settings.partnerLabel')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('settings.partnerLabelHint')}</p>
              </div>
              <Select
                value={draft.partnerLabel || 'partner'}
                onValueChange={(v) => {
                  setDraft((d) => ({ ...d, partnerLabel: v }));
                  updateSettings({ partnerLabel: v });
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="husband">Husband</SelectItem>
                  <SelectItem value="wife">Wife</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <PartnerSyncOptions />
            <FriendConnections />
            <CalendarImport />
          </TabsContent>

          {/* Plan — subscription, access codes, and cancellation */}
          <TabsContent value="plan" className="space-y-5 mt-0">
            <SubscribePremium />
            {userRole === 'admin' && (
              <Link to="/analytics" className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-heading text-sm font-semibold">{t('settings.analyticsDashboard')}</p>
                    <p className="text-xs text-muted-foreground">{t('settings.analyticsDashboardHint')}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{t('settings.viewArrow')}</span>
              </Link>
            )}
            {userRole === 'admin' && (
              <a
                href="https://base44.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-heading text-sm font-semibold">{t('settings.createNewApp')}</p>
                    <p className="text-xs text-muted-foreground">{t('settings.createNewAppHint')}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{t('settings.openArrow')}</span>
              </a>
            )}
            {userRole === 'admin' && <OpsControlPanel />}
            {userRole === 'admin' && <AccessCodeManager />}
            {userRole === 'admin' && <CancelRequestManager />}
            {userRole === 'admin' && <AffiliateLinkManager />}
            {userRole === 'admin' && <SuggestionManager />}
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-5">
          {t('settings.changesSaveAuto')}
        </p>
      </div>
    </div>
  );
}