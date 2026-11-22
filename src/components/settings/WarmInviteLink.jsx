import React, { useState } from 'react';
import { Copy, Check, MessageSquare, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/I18nContext';

// A second, quieter way to invite someone: no pitch, just a short warm note in
// the sender's own voice, with the link to the app inside it. Kept separate from
// the friend-code invite above so a user can choose the personal tone instead.
export default function WarmInviteLink({ code, senderName }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}/welcome`;
  const firstName = (senderName || '').trim().split(/\s+/)[0] || 'me';
  const message = t('app.warmInviteMessage', {
    name: firstName,
    app: t('app.name'),
    link,
    code: code || '',
  });

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast({ title: 'Warm invite copied' });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    toast({ title: 'Link copied' });
  };

  const sendText = () => {
    const a = document.createElement('a');
    a.href = `sms:?&body=${encodeURIComponent(message)}`;
    a.click();
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-3.5">
      <div>
        <p className="text-sm font-medium">Share a warmer hello</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          A short note in your own voice, with the link to {t('app.name')} inside it.
        </p>
      </div>

      <p className="whitespace-pre-line text-xs leading-relaxed text-foreground/80">{message}</p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={copyMessage} className="h-9 flex-1 gap-1.5 text-xs">
          {copied ? <Check size={14} /> : <Copy size={14} />} Copy message
        </Button>
        <Button onClick={sendText} className="h-9 flex-1 gap-1.5 text-xs">
          <MessageSquare size={14} /> Send by text
        </Button>
      </div>

      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 text-[11px] font-medium text-primary min-h-[32px]"
      >
        <Link2 size={12} /> Copy the link on its own
      </button>
    </div>
  );
}