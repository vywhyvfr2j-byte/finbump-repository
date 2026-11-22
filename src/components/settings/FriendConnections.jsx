import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Copy, MessageSquare, Trash2, Loader2, UserPlus } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { generateAccessCode } from '@/lib/accessCode';
import WarmInviteLink from '@/components/settings/WarmInviteLink';

// Everything a user can choose to share with non-partner friends. Grouped into
// profile basics and FinBump data modules so the user controls exactly what
// each friend sees when connected. Defaults: name + photo only.
const SHARE_GROUPS = (t) => [
  {
    heading: 'Profile basics',
    fields: [
      { key: 'name', label: 'My name', hint: 'Your display name' },
      { key: 'photo', label: 'My photo', hint: 'Your profile picture' },
      { key: 'birthday', label: 'My birthday', hint: 'So they remember it' },
      { key: 'phone', label: 'My phone number', hint: 'For reaching out' },
      { key: 'email', label: 'My email', hint: 'For longer messages' },
      { key: 'likes', label: 'My likes & interests', hint: 'Things you enjoy' },
      { key: 'details', label: 'My custom details', hint: 'Freeform label/value pairs' },
      { key: 'notes', label: 'My notes', hint: 'Freeform details about you' },
    ],
  },
  {
    heading: t('app.dataModule'),
    fields: [
      { key: 'acts', label: 'Acts of support', hint: 'Scheduled acts & reminders' },
      { key: 'giftIdeas', label: 'Gift ideas', hint: 'Saved gift suggestions' },
      { key: 'events', label: 'Events & milestones', hint: 'Important dates' },
      { key: 'trips', label: 'Trips & vacation plans', hint: 'Shared travel ideas' },
      { key: 'pets', label: 'Pets', hint: 'Pet profiles' },
      { key: 'prayer', label: 'Prayer reminders', hint: 'Prayers you are offering for others' },
      { key: 'myPrayerRequests', label: 'My prayer requests', hint: 'Your own prayer needs shared with connections' },
      { key: 'myHealthNeeds', label: 'My health needs', hint: 'Your own health needs shared with connections' },
      { key: 'myOtherNeeds', label: 'My other needs', hint: 'Your other personal needs shared with connections' },
      { key: 'health', label: 'Health notes', hint: 'Health check-in details' },
      { key: 'goals', label: 'Relationship goals', hint: 'Goals & progress' },
    ],
  },
];

export default function FriendConnections() {
  const { t } = useI18n();
  const { people, deletePerson, settings, updateSettings } = useKeepsake();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteNote, setInviteNote] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  // friendShareSettings lives in the local settings store — a simple map of
  // field-key -> boolean. Defaults to sharing name and photo only.
  const shareSettings = settings.friendShareSettings || { name: true, photo: true };

  const loadUser = async () => {
    let me = await base44.auth.me();
    if (!me.friendCode) {
      me = await base44.auth.updateMe({ friendCode: generateAccessCode(8) });
    }
    setUser(me);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.friendCode || '');
    toast({ title: 'Code copied!' });
  };

  const toggleShare = (key) => {
    const updated = { ...shareSettings, [key]: !shareSettings[key] };
    updateSettings({ friendShareSettings: updated });
  };

  const handleSendInvite = () => {
    setSending(true);
    const code = user?.friendCode || '';
    const appUrl = window.location.origin;
    const note = inviteNote.trim() ? `\n${inviteNote.trim()}` : '';
    const message = t('app.stayConnectedFriend', { code, url: appUrl + note });
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
    const a = document.createElement('a');
    a.href = smsUrl;
    a.click();
    setSending(false);
    setShowInvite(false);
    setInviteNote('');
    toast({ title: 'Invite opened in messages' });
  };

  const handleDeleteContact = async (person) => {
    setDeletingId(person.id);
    try {
      await deletePerson(person.id);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  // Non-partner people are the "friends / connections" in this context.
  const connections = people.filter((p) => p.relation !== 'partner');

  return (
    <div className="space-y-5">
      {/* Invite a friend */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
        <div>
          <p className="text-sm font-medium">Invite a friend</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share this code with anyone you'd like to stay connected with. They'll see only what you allow below.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 bg-secondary/60 rounded-xl px-4 py-3">
          <span className="font-display text-lg tracking-[0.25em] font-semibold">{user?.friendCode || '…'}</span>
          <button onClick={handleCopy} className="text-primary shrink-0" aria-label="Copy friend code">
            <Copy size={18} />
          </button>
        </div>

        {/* Toggle checklist of what to share */}
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">What they'll see</p>
          {SHARE_GROUPS(t).map((group) => (
            <div key={group.heading} className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground/80">{group.heading}</p>
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {group.fields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between px-3.5 py-2.5 bg-secondary/20">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="text-[11px] text-muted-foreground">{field.hint}</p>
                    </div>
                    <Switch
                      checked={!!shareSettings[field.key]}
                      onCheckedChange={() => toggleShare(field.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
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
              <Button onClick={handleSendInvite} disabled={sending} className="h-10 flex-1 gap-1.5">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />} Send via text
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
          >
            <UserPlus size={15} /> Send invite via text
          </button>
        )}

        <WarmInviteLink code={user?.friendCode} senderName={user?.full_name} />
      </div>

      {/* Your connections with delete access */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div>
          <p className="text-sm font-medium">Your connections</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            People you're tracking. Remove anyone you no longer need.
          </p>
        </div>

        {connections.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No connections yet. Add people from the People tab, then invite them above.</p>
        ) : (
          <div className="space-y-2">
            {connections.map((person) => (
              <div key={person.id} className="flex items-center justify-between gap-3 bg-secondary/30 rounded-xl px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{person.name}</p>
                  {person.relation && (
                    <p className="text-[11px] text-muted-foreground capitalize">{person.relation}</p>
                  )}
                </div>
                {confirmId === person.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => setConfirmId(null)}
                      disabled={deletingId === person.id}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1"
                      onClick={() => handleDeleteContact(person)}
                      disabled={deletingId === person.id}
                    >
                      {deletingId === person.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      Delete
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(person.id)}
                    className="flex items-center justify-center w-11 h-11 rounded-full text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    aria-label={`Delete ${person.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}