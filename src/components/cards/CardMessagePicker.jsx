import React from 'react';
import { CARD_MESSAGE_LIBRARY, fillTemplate } from '@/lib/cardMessageLibrary';
import { BookOpen, Check } from 'lucide-react';

// Visual picker for the pre-written card message library. Shows each
// ready-made message as a selectable card with its full text visible so the
// user can browse and pick quickly instead of guessing from a title list.
export default function CardMessagePicker({ occasion, recipientName, onPick, selectedTitle }) {
  const messages = CARD_MESSAGE_LIBRARY[occasion] || [];
  if (!messages.length) return null;

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <BookOpen size={13} /> Ready-made message (free)
      </label>
      <div className="space-y-2 max-h-64 overflow-y-auto -mr-1 pr-1 no-scrollbar">
        {messages.map((m) => {
          const isActive = selectedTitle === m.title;
          return (
            <button
              key={m.title}
              type="button"
              onClick={() => onPick(m.title, fillTemplate(m.text, recipientName))}
              className={`w-full text-left rounded-2xl border p-3 transition-colors ${
                isActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-accent/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground">{m.title}</span>
                {isActive && <Check size={14} className="text-primary shrink-0" />}
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-4">
                {fillTemplate(m.text, recipientName)}
              </p>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">Pick one to start, then edit it to make it yours — or generate a custom one below.</p>
    </div>
  );
}