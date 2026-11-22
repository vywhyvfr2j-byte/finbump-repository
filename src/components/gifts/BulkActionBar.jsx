import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/giftConstants';

const GIFT_STATUSES = ['Idea', 'Purchased', 'Gifted'];

export default function BulkActionBar({ count, onClear, onDelete, onMoveCategory, onSetStatus }) {
  const [moveCat, setMoveCat] = useState('');
  const [status, setStatus] = useState('');
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-[76px] z-40 max-w-[440px] mx-auto px-4">
      <div className="rounded-2xl bg-card border border-border shadow-lg p-3 flex items-center gap-2">
        <span className="text-sm font-medium flex-1 min-w-0">
          {count} selected
        </span>
        {onSetStatus && (
          <Select
            value={status}
            onValueChange={(v) => {
              onSetStatus(v);
              setStatus('');
            }}
          >
            <SelectTrigger className="h-9 w-[130px] shrink-0">
              <SelectValue placeholder="Set status…" />
            </SelectTrigger>
            <SelectContent>
              {GIFT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {onMoveCategory && (
          <Select
            value={moveCat}
            onValueChange={(v) => {
              onMoveCategory(v);
              setMoveCat('');
            }}
          >
            <SelectTrigger className="h-9 w-[120px] shrink-0">
              <SelectValue placeholder="Move to…" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="destructive" size="sm" onClick={onDelete} className="h-9 shrink-0">
          <Trash2 size={15} /> Delete
        </Button>
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear selection" className="h-11 w-11 shrink-0">
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}