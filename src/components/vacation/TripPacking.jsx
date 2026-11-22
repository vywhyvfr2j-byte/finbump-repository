import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Luggage } from 'lucide-react';

const OWNER_META = {
  both: { label: 'Both', cls: 'bg-primary/10 text-primary' },
  me: { label: 'Me', cls: 'bg-accent/15 text-accent-foreground' },
  partner: { label: 'Partner', cls: 'bg-secondary text-secondary-foreground' },
};

export default function TripPacking({ trip, onAddItem, onToggleItem, onDeleteItem, partnerName }) {
  const [label, setLabel] = useState('');
  const [owner, setOwner] = useState('both');

  const items = Array.isArray(trip.packingList) ? trip.packingList : [];
  const open = items.filter((i) => !i.packed);
  const packed = items.filter((i) => i.packed);
  const progress = items.length ? Math.round((packed.length / items.length) * 100) : 0;

  const handleAdd = () => {
    if (!label.trim()) return;
    onAddItem({ label: label.trim(), owner });
    setLabel('');
    setOwner('both');
  };

  const renderRow = (item) => {
    const meta = OWNER_META[item.owner] || OWNER_META.both;
    return (
      <div key={item.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3 pr-2">
        <Checkbox checked={!!item.packed} onCheckedChange={() => onToggleItem(item.id)} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${item.packed ? 'line-through text-muted-foreground' : 'font-medium'}`}>{item.label}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${meta.cls}`}>
            {item.owner === 'partner' ? partnerName || meta.label : meta.label}
          </span>
        </div>
        <button onClick={() => onDeleteItem(item.id)} aria-label="Delete packing item" className="text-muted-foreground shrink-0 w-11 h-11 flex items-center justify-center">
          <Trash2 size={15} />
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="space-y-2 mb-3">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add to packing list" className="h-10" />
        <div className="flex gap-2">
          <Select value={owner} onValueChange={setOwner}>
            <SelectTrigger className="h-10 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both pack</SelectItem>
              <SelectItem value="me">I'll pack</SelectItem>
              <SelectItem value="partner">{(partnerName || 'Partner') + ' packs'}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!label.trim()} className="h-10">
            Add
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 text-center">{packed.length} of {items.length} packed</p>
        </div>
      )}

      <div className="space-y-2.5">
        {open.length > 0 && renderRows(open, renderRow, 'To pack')}
        {packed.length > 0 && renderRows(packed, renderRow, 'Packed')}
        {items.length === 0 && (
          <div className="text-center py-8">
            <Luggage size={28} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No packing items yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function renderRows(list, renderRow, label) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{label}</p>
      {list.map(renderRow)}
      {label === 'To pack' && <div className="h-px bg-border my-2.5" />}
    </div>
  );
}