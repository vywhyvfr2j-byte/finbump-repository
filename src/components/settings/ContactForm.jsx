import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// In-app contact form: submits a message to a backend function that emails
// the provider's support address (SUPPORT_EMAIL secret). Lets users ask
// questions or report issues without leaving the app.
export default function ContactForm() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({ title: 'Write a message first', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await base44.functions.invoke('send-contact-message', { message });
      toast({ title: 'Message sent!', description: "We'll get back to you soon." });
      setMessage('');
    } catch (e) {
      toast({ title: 'Could not send', description: e?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Mail size={16} className="text-primary" />
        <p className="text-sm font-medium">Contact us</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Have a question or need help? Send us a message and we'll reply by email.
      </p>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message…"
        aria-label="Message"
        className="min-h-[100px] resize-none"
      />
      <Button onClick={handleSubmit} disabled={sending} className="w-full h-11 rounded-xl">
        {sending ? 'Sending…' : 'Send message'}
      </Button>
    </div>
  );
}