import React, { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Bell } from 'lucide-react';

// Bottom-sheet prompt for creating a MemoryRefresh reminder. Offers quick
// presets (1 week / 1 month / 3 months) and a custom date picker. One tap
// creates the reminder — no AI, no credits, just a date.
const QUICK_OPTIONS = [
  { label: 'In 1 week', days: 7 },
  { label: 'In 1 month', days: 30 },
  { label: 'In 3 months', days: 90 },
];

export default function MemoryRefreshPrompt({ open, onOpenChange, target }) {
  const { addMemoryRefresh } = useKeepsake();
  const [customDate, setCustomDate] = useState(null);

  const create = (refreshAt) => {
    if (!target) return;
    addMemoryRefresh({
      personId: target.personId,
      label: target.label,
      sourceType: target.sourceType || 'manual',
      sourceId: target.sourceId || '',
      refreshAt,
    });
    setCustomDate(null);
    onOpenChange(false);
  };

  const handleQuick = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    create(d.toISOString());
  };

  const handleCustom = () => {
    if (!customDate) return;
    const d = new Date(customDate);
    d.setHours(9, 0, 0, 0);
    create(d.toISOString());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-[440px] mx-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            Remind me of this
          </SheetTitle>
          <SheetDescription>
            {target?.label ? `"${target.label}"` : 'Pick when to revisit this memory.'} Set a gentle reminder to refresh your memory of time spent with, or thinking about, this contact.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-2 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {QUICK_OPTIONS.map((opt) => (
              <Button
                key={opt.days}
                variant="outline"
                onClick={() => handleQuick(opt.days)}
                className="rounded-xl"
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Or pick a date</p>
            <div className="flex flex-col items-center gap-3">
              <Calendar
                mode="single"
                selected={customDate}
                onSelect={setCustomDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-lg border border-border"
              />
              <Button
                onClick={handleCustom}
                disabled={!customDate}
                className="w-full rounded-xl"
              >
                Set reminder
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full rounded-xl">
            Not now
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}