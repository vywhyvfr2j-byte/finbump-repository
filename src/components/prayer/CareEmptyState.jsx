import React from 'react';
import KsPrayer from '@/components/icons/KsPrayer';
import { Plus } from 'lucide-react';

export default function CareEmptyState({ message, submessage, onAdd, addButtonLabel }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <KsPrayer size={56} />
      <p className="font-display text-lg font-semibold mt-4 mb-1">{message}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{submessage}</p>
      <button
        onClick={onAdd}
        className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5"
      >
        <Plus size={16} /> {addButtonLabel}
      </button>
    </div>
  );
}