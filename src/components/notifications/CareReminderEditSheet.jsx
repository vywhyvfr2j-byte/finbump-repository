import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const CADENCE_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '7', label: 'Every 7 days' },
  { value: '30', label: 'Every 30 days' },
  { value: '60', label: 'Every 60 days' },
  { value: '90', label: 'Every 90 days' },
];

// Cadence options, keeping a cadence the contact already has (e.g. every 14 days)
// selectable instead of showing an empty field.
const optionsFor = (value) => (
  CADENCE_OPTIONS.some((o) => o.value === String(value))
    ? CADENCE_OPTIONS
    : [{ value: String(value), label: `Every ${value} days` }, ...CADENCE_OPTIONS]
);

// Edits the check-in frequency behind a care notification, so a reminder can be
// retuned from the notification itself. Mounted only while editing, so its
// fields seed from the current contact values.
export default function CareReminderEditSheet({ contact, types, onClose, onSave }) {
  const showHealth = types.includes('health');
  const showOther = types.includes('other');
  const [health, setHealth] = useState(String(contact.healthReminderDays || 0));
  const [other, setOther] = useState(String(contact.otherReminderDays || 0));

  const handleSave = () => {
    const patch = {};
    if (showHealth) patch.healthReminderDays = Number(health) || 0;
    if (showOther) patch.otherReminderDays = Number(other) || 0;
    onSave(patch);
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-w-[440px] mx-auto rounded-t-2xl max-h-[90dvh] overflow-y-auto p-5">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-base">Edit reminder</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground mt-1">How often to check in on {contact.name}.</p>

        <div className="space-y-4 mt-5">
          {showHealth && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Health check-in</label>
              <Select value={health} onValueChange={setHealth}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {optionsFor(health).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {showOther && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Other check-in</label>
              <Select value={other} onValueChange={setOther}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {optionsFor(other).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button onClick={handleSave} className="w-full h-12 rounded-2xl">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}