import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote } from 'lucide-react';

export default function TripNotes({ trip, editable, onChange }) {
  const [text, setText] = useState(trip.notes || '');

  useEffect(() => {
    setText(trip.notes || '');
  }, [trip.id, trip.notes]);

  const handleBlur = () => {
    if (text.trim() !== (trip.notes || '')) onChange(text.trim());
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <StickyNote size={16} className="text-accent" />
        <p className="text-sm font-medium">Trip notes</p>
      </div>
      {editable ? (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          placeholder="Add small notes for this getaway — ideas, reminders, things to remember…"
          className="min-h-[140px] resize-none"
        />
      ) : (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[60px]">
          {trip.notes || 'No notes yet.'}
        </p>
      )}
    </div>
  );
}