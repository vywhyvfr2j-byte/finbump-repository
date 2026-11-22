import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageSquare, Check, Link2, AlertCircle } from 'lucide-react';

const APP_URL = 'https://finbump-memory.base44.app';

// Bottom sheet for sending a text or email to a selected subset of a group's
// members, with an editable shared link appended to the message body.
export default function BulkMessageSheet({ open, onOpenChange, groupName, members }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [channel, setChannel] = useState('text');
  const [message, setMessage] = useState('Hi everyone 👋');
  const [link, setLink] = useState(APP_URL);

  // Reset to "everyone, text channel, default message" each time the sheet opens.
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set((members || []).map((m) => m.id)));
      setChannel('text');
      setMessage('Hi everyone 👋');
      setLink(APP_URL);
    }
  }, [open, members]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = (members || []).length > 0 && selectedIds.size === (members || []).length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set((members || []).map((m) => m.id)));
  };

  const selected = (members || []).filter((m) => selectedIds.has(m.id));
  const reachable = selected.filter((m) =>
    Boolean(((channel === 'text' ? m.phone : m.email) || '').trim())
  );
  const missing = selected.length - reachable.length;

  const send = () => {
    if (!reachable.length) {
      alert(
        channel === 'text'
          ? 'None of the selected members have a phone number. Add phone numbers to their profiles first.'
          : 'None of the selected members have an email address. Add emails to their profiles first.'
      );
      return;
    }
    const body = link.trim() ? `${message}\n${link.trim()}` : message;
    const url = channel === 'text'
      ? `sms:/open?addresses=${encodeURIComponent(reachable.map((m) => m.phone.trim()).join(','))}&body=${encodeURIComponent(body)}`
      : `mailto:?bcc=${encodeURIComponent(
          reachable.map((m) => m.email.trim()).join(',')
        )}&subject=${encodeURIComponent(groupName || 'Message')}&body=${encodeURIComponent(body)}`;
    // Hand the sms:/mailto: link to a temporary anchor instead of assigning it to
    // location.href: a non-http scheme there aborts in some WebViews and can
    // navigate the single-page app away from the sheet.
    const linkEl = document.createElement('a');
    linkEl.href = url;
    linkEl.rel = 'noopener';
    document.body.appendChild(linkEl);
    linkEl.click();
    linkEl.remove();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Bulk message</SheetTitle>
          <SheetDescription>Select members and send a text or email with a shared link.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Channel toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setChannel('text')}
              className={`flex items-center justify-center gap-1.5 h-11 rounded-xl border text-sm font-medium transition-colors ${
                channel === 'text' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
              }`}
            >
              <MessageSquare size={16} /> Text
            </button>
            <button
              type="button"
              onClick={() => setChannel('email')}
              className={`flex items-center justify-center gap-1.5 h-11 rounded-xl border text-sm font-medium transition-colors ${
                channel === 'email' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
              }`}
            >
              <Mail size={16} /> Email
            </button>
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {selectedIds.size} of {members.length} selected · {reachable.length} reachable
              </span>
              <button onClick={toggleAll} className="text-primary text-xs font-medium">
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {members.map((m) => {
                const isSelected = selectedIds.has(m.id);
                const hasContact = Boolean(((channel === 'text' ? m.phone : m.email) || '').trim());
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 border transition-colors ${
                      isSelected ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-primary" />}
                    </span>
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt="" loading="lazy" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                        {(m.name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="flex-1 min-w-0 text-left">
                      <span className="text-sm font-medium truncate block">{m.preferredName || m.name}</span>
                      <span className="text-xs text-muted-foreground truncate block">
                        {hasContact
                          ? channel === 'text'
                            ? m.phone || ''
                            : m.email || ''
                          : `No ${channel === 'text' ? 'phone' : 'email'}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {missing > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <AlertCircle size={12} /> {missing} selected {missing === 1 ? 'member is' : 'members are'} missing{' '}
                {channel === 'text' ? 'a phone number' : 'an email address'}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Message</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[64px]" />
          </div>

          {/* Shared link */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Link2 size={12} /> Shared link
            </label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste a link to share"
              className="h-11"
            />
          </div>

          <Button onClick={send} disabled={!reachable.length} className="w-full h-12 rounded-2xl">
            <MessageSquare size={18} className="mr-1.5" /> Send {channel === 'text' ? 'text' : 'email'} to{' '}
            {reachable.length}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}