import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TRADITIONS = [
  { value: 'christian', label: 'Christian' },
  { value: 'jewish', label: 'Jewish' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'other', label: 'Other' },
];

// Only shown while Scripture is on: the daily verse and reflection follow the
// tradition picked here, and "None / skip" leaves scripture general.
export default function FaithTraditionPicker({ value, other, onChange, onOtherChange, className = '' }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-3.5 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        Faith tradition for Scripture
      </label>
      <Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}>
        <SelectTrigger className="h-11"><SelectValue placeholder="Choose your tradition" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None / skip</SelectItem>
          {TRADITIONS.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value === 'other' && (
        <Input
          value={other || ''}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Your specific tradition (e.g. Sikh, Bahá'í)"
          aria-label="Your specific faith tradition"
          className="h-11 mt-2"
        />
      )}
      <p className="text-[11px] text-muted-foreground mt-1.5">
        You can change or remove this anytime.
      </p>
    </div>
  );
}