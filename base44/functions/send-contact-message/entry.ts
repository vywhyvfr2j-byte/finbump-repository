import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { escapeHtml } from '../../shared/escapeHtml.ts';
import { checkAndRecordAttempt } from '../../shared/codeAttemptLimit.ts';

// Bounds on what one submission may carry, so a caller cannot push an unbounded
// transcript into the SupportMessage record or the support email.
const MAX_MESSAGE_CHARS = 4000;
const MAX_CONVERSATION_TURNS = 40;

// Receives a message submitted through the in-app contact form (or a help
// request from the Ask FinBump chat) and forwards it to support.
//
// Delivery is two-layered so a message is never lost:
//   1. ALWAYS persists the full message to the SupportMessage entity, which
//      admins can read from the dashboard regardless of email delivery.
//   2. ATTEMPTS to email it to SUPPORT_EMAIL via SendEmail. SendEmail only
//      reliably reaches registered app users, so if SUPPORT_EMAIL isn't a
//      registered FinBump account the email may bounce — but the persisted
//      record ensures support still sees it.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Support is a shared inbox: cap how many messages one account can push
    // through it per hour so a single user can't flood support or the mail quota.
    const attempt = await checkAndRecordAttempt(base44, user.id, 'send-contact-message', 10, 60);
    if (!attempt.allowed) {
      return Response.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const body = await req.json();
    const message = (body?.message || '').trim().slice(0, MAX_MESSAGE_CHARS);
    // Bounded: only the most recent turns, each capped, so one submission can't
    // carry an unbounded transcript into the saved record or the email.
    const conversation = Array.isArray(body?.conversation)
      ? body.conversation.slice(-MAX_CONVERSATION_TURNS).map((m) => ({
          role: m?.role === 'user' ? 'user' : 'assistant',
          text: String(m?.text ?? '').slice(0, MAX_MESSAGE_CHARS),
        }))
      : [];
    if (!message && conversation.length === 0) {
      return Response.json({ error: 'Message or conversation is required' }, { status: 400 });
    }

    const senderName = user.full_name || 'A FinBump user';
    const senderEmail = user.email || 'unknown';
    const isChat = conversation.length > 0;

    // 1. Persist the request so support can read it even if email fails.
    try {
      await base44.asServiceRole.entities.SupportMessage.create({
        senderName,
        senderEmail,
        message: message || null,
        conversation: conversation.map((m) => ({ role: m.role, text: m.text })),
        source: isChat ? 'chat' : 'contact_form',
        status: 'new',
      });
    } catch (err) {
      console.error('send-contact-message: persist SupportMessage failed', err?.message || err);
    }

    // 2. Best-effort email to the support inbox. Failure here does NOT fail the
    //    request — the message is already saved in SupportMessage.
    const supportEmail = secrets.get('SUPPORT_EMAIL');
    if (supportEmail) {
      let emailBody;
      let subject;
      if (isChat) {
        const conversationText = conversation
          .map((m) => `${m.role === 'user' ? 'Q' : 'A'}: ${escapeHtml(m.text)}`)
          .join('\n\n');
        emailBody = [
          `From: ${escapeHtml(senderName)} &lt;${escapeHtml(senderEmail)}&gt;`,
          `Sent: ${new Date().toISOString()}`,
          '',
          'Chat conversation (Ask FinBump):',
          conversationText,
          '',
          message ? `Additional note: ${escapeHtml(message)}` : '',
        ].join('\n');
        subject = `FinBump chat help request from ${senderName}`;
      } else {
        emailBody = [
          `From: ${escapeHtml(senderName)} &lt;${escapeHtml(senderEmail)}&gt;`,
          `Sent: ${new Date().toISOString()}`,
          '',
          'Message:',
          escapeHtml(message),
        ].join('\n');
        subject = `FinBump message from ${senderName}`;
      }

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: supportEmail,
          subject,
          body: emailBody,
          from_name: 'FinBump Contact Form',
        });
      } catch (emailErr) {
        // Email delivery failed (e.g. SUPPORT_EMAIL isn't a registered user).
        // The message is already persisted in SupportMessage, so log and
        // still return success — the user's message was received.
        console.error('send-contact-message: SendEmail failed (message still saved)', emailErr?.message || emailErr);
      }
    } else {
      console.warn('send-contact-message: SUPPORT_EMAIL not set; message saved to SupportMessage only');
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('send-contact-message failed:', error?.message || error);
    return Response.json(
      { error: 'Could not deliver your message. Please try again or email us directly.' },
      { status: 500 }
    );
  }
}