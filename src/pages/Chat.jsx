import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FINBUMP_KNOWLEDGE, SUGGESTED_QUESTION_GROUPS } from '@/lib/chatKnowledge';
import { findScriptMatch } from '@/lib/chatScript';
import { Send, Sparkles, LifeBuoy } from 'lucide-react';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useAIMessageLimit } from '@/hooks/useAIMessageLimit';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function Chat() {
  useFeatureTracking('chat');
  const { t } = useI18n();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingSupport, setSendingSupport] = useState(false);
  const [aiHelpGiven, setAiHelpGiven] = useState(false);
  const { toast } = useToast();
  const { remaining, canGenerate, increment, limit } = useAIMessageLimit();
  const scrollRef = useRef(null);
  const CHAT_STORAGE_KEY = 'finbump_chat_history';

  // #6: Load the last conversation on mount so "Ask FinBump" feels continuous
  // across navigation away and back.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  // #6: Persist the conversation (last 30 messages) whenever it changes.
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
      } else {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendQuestion = async (question) => {
    if (!question.trim() || loading) return;
    const userMessage = { role: 'user', text: question };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setAiHelpGiven(false);

    // 1. Check the predefined script first — instant, no AI cost.
    const scriptMatch = findScriptMatch(question);
    if (scriptMatch) {
      // Script answers are free — they don't count toward the AI message limit.
      // Brief delay so the typing indicator is visible and feels natural.
      setTimeout(() => {
        setMessages((m) => [...m, { role: 'assistant', text: scriptMatch.answer }]);
        setLoading(false);
      }, 500);
      return;
    }

    // 2. Fallback to AI for anything not in the script.
    if (!canGenerate) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: t('chat.allUsed', { limit }),
        },
      ]);
      setLoading(false);
      return;
    }
    increment();
    try {
      const conversation = updatedMessages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');
      const prompt =
        `${FINBUMP_KNOWLEDGE}\n\n` +
        `Answer the user's latest question using only the knowledge base above. ` +
        `Be warm, concise, and specific to FinBump's actual features. ` +
        `If the question is not covered, say you don't have that information and suggest contacting support via Settings.\n\n` +
        `Conversation so far:\n${conversation}\n\nAnswer:`;
      const res = await base44.functions.invoke('invoke-premium-llm', {
        prompt,
        response_json_schema: {
          type: 'object',
          properties: { answer: { type: 'string' } },
          required: ['answer'],
        },
      });
      const answer =
        res?.data?.answer ||
        t('chat.errorDetailed');
      setMessages((m) => [...m, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: t('chat.error'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // "Still need help? → Ask AI": re-sends the conversation to the LLM with a
  // prompt that asks for a more detailed, helpful response.
  const handleAskAIMore = async () => {
    if (loading || messages.length === 0) return;
    if (!canGenerate) {
      toast({ title: t('chat.limitReached', { limit }), description: t('chat.comeBack') });
      return;
    }
    increment();
    const conversation = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n');
    setMessages((m) => [...m, { role: 'user', text: t('chat.stillNeed') }]);
    setLoading(true);
    try {
      const prompt =
        `${FINBUMP_KNOWLEDGE}\n\n` +
        `The user has been chatting with you but still needs more help. ` +
        `Review the conversation below and provide a more detailed, step-by-step response ` +
        `that fully addresses their underlying need. If you truly cannot help with the ` +
        `knowledge base, say so clearly and suggest they contact support.\n\n` +
        `Conversation so far:\n${conversation}\n\nDetailed answer:`;
      const res = await base44.functions.invoke('invoke-premium-llm', {
        prompt,
        response_json_schema: {
          type: 'object',
          properties: { answer: { type: 'string' } },
          required: ['answer'],
        },
      });
      const answer =
        res?.data?.answer ||
        t('chat.errorMore');
      setMessages((m) => [...m, { role: 'assistant', text: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: t('chat.errorSupport'),
        },
      ]);
    } finally {
      setAiHelpGiven(true);
      setLoading(false);
    }
  };

  // "Still need help? → Contact support": sends the full conversation (Q&A)
  // and the user's contact info to the support team via email.
  const handleContactSupport = async () => {
    if (sendingSupport || messages.length === 0) return;
    setSendingSupport(true);
    try {
      await base44.functions.invoke('send-contact-message', {
        message: 'User requested help from the Ask FinBump chat assistant.',
        conversation: messages.map((m) => ({ role: m.role, text: m.text })),
      });
      toast({
        title: t('chat.sentToSupport'),
        description: t('chat.willReview'),
      });
    } catch (e) {
      toast({ title: t('chat.couldNotSend'), description: e?.message, variant: 'destructive' });
    } finally {
      setSendingSupport(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto flex flex-col pb-[5.5rem]">
      <TopNav title={t('chat.title')} subtitle={t('chat.subtitle')} backTo="/" />
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center pt-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">{t('chat.howCanHelp')}</h2>
            <p className="text-sm text-muted-foreground text-center mb-6 px-4">
              {t('chat.intro')}
            </p>
            <div className="flex flex-col gap-4 w-full">
              {SUGGESTED_QUESTION_GROUPS.map((group) => (
                <div key={group.label} className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">{group.label}</p>
                  {group.questions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendQuestion(q)}
                      className="text-left text-sm bg-card border border-border rounded-xl px-4 py-2.5 hover:bg-secondary/60 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </div>
      <div className="border-t border-border bg-card/80 backdrop-blur-md px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {messages.length > 0 && !loading && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleAskAIMore}
              disabled={loading || sendingSupport}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg py-2 hover:bg-primary/15 transition-colors disabled:opacity-50"
            >
              <Sparkles size={14} />
              {t('chat.askAgain')}
            </button>
            <button
              onClick={handleContactSupport}
              disabled={loading || sendingSupport}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary rounded-lg py-2 hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <LifeBuoy size={14} />
              {sendingSupport ? t('chat.sending') : t('chat.contactSupport')}
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.askPlaceholder')}
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} title="Send">
            <Send size={18} />
          </Button>
        </form>
        {remaining < limit && (
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            {canGenerate
              ? t('chat.messagesLeft', { remaining })
              : t('chat.noMessages')}
          </p>
        )}
      </div>
    </div>
  );
}