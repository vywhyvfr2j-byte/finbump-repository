import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, ChefHat, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TreatAdvisor({ personId, personName }) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const startConversation = useCallback(async () => {
    if (!personId || !personName) return;
    setLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'treat_advisor',
        metadata: { name: `Treat ideas for ${personName}`, description: `Treat recommendations for ${personName}` },
      });
      setConversation(conv);
      setMessages(conv.messages || []);
      // Send the initial request with the person context so the agent knows who to analyze.
      const initialMessage = `Recommend the perfect treats for ${personName} (Person ID: ${personId}). Read their saved preferences, likes, details, notes, and any upcoming milestones, then suggest 3-5 treat ideas across drinks, snacks, meals, and desserts. For each, give a title, category, reason, and recipe link if applicable.`;
      const updated = await base44.agents.addMessage(conv, { role: 'user', content: initialMessage });
      setMessages(updated.messages || []);
    } catch (err) {
      console.error('TreatAdvisor start error', err);
    } finally {
      setLoading(false);
    }
  }, [personId, personName]);

  // Subscribe to conversation updates once we have one.
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      // Only update if the subscription delivers actual messages — skip empty
      // payloads that would wipe the conversation mid-stream.
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      }
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);
    try {
      const updated = await base44.agents.addMessage(conversation, { role: 'user', content: text });
      setMessages(updated.messages || []);
    } catch (err) {
      console.error('TreatAdvisor send error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderToolCall = (toolCall, idx) => {
    const status = toolCall.status || 'pending';
    const isDone = ['completed', 'success'].includes(status);
    const isFailed = ['failed', 'error'].includes(status);
    const label = toolCall.display_projection?.label || toolCall.name || 'Tool';
    const statusText = isFailed
      ? 'failed'
      : ['pending', 'running', 'in_progress'].includes(status)
      ? 'working…'
      : 'done';
    return (
      <div key={idx} className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
        <ChefHat size={12} className={isFailed ? 'text-destructive' : isDone ? 'text-accent-foreground' : 'animate-pulse'} />
        <span>{label}</span>
        <span className={isFailed ? 'text-destructive' : 'text-muted-foreground/70'}>· {statusText}</span>
      </div>
    );
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          startConversation();
        }}
        className="w-full flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/40 px-4 py-3 mb-4 hover:from-accent/40 hover:to-accent/20 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={18} className="text-accent-foreground shrink-0" />
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold leading-tight">AI Treat Advisor</p>
            <p className="text-xs text-muted-foreground leading-tight">Recommends treats from their preferences & milestones</p>
          </div>
        </div>
        <span className="text-xs font-medium text-accent-foreground shrink-0">Start</span>
      </button>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-accent/40 mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-accent/15 px-4 py-3 border-b border-accent/30">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={16} className="text-accent-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">AI Treat Advisor</p>
            <p className="text-xs text-muted-foreground leading-tight truncate">For {personName}</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground shrink-0 p-1"
          aria-label="Close advisor"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="max-h-[420px] overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            <ChefHat size={16} className="animate-pulse mr-2" /> Analyzing {personName}'s preferences…
          </div>
        )}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          // Skip the initial seeded user message — it's long and internal.
          if (isUser && idx === 0) return null;
          return (
            <div key={idx} className={isUser ? 'flex justify-end' : 'flex justify-start'}>
              <div className={isUser ? 'max-w-[85%]' : 'max-w-[90%] w-full'}>
                {msg.content && (
                  isUser ? (
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3.5 py-2 text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )
                )}
                {msg.tool_calls?.map((tc, tcIdx) => renderToolCall(tc, tcIdx))}
              </div>
            </div>
          );
        })}
        {loading && messages.length > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-2.5 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for a treat, or say 'save them all'…"
          className="h-11 text-sm"
          disabled={loading}
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          size="icon"
          className="w-11 shrink-0"
          aria-label="Send message"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}