import React from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Type, Contrast } from 'lucide-react';

// Accessibility settings for users who need larger text, higher contrast,
// or screen-reader-friendly labels. Values persist in the settings slice
// and are applied app-wide by useAccessibilityApplier (mounted in App.jsx).
//
// Each row gives its label block a readable minimum width (min-w-[11rem]) and
// wraps, so once text is enlarged the control moves onto its own line instead
// of squeezing the description into a sliver of one word per line.
export default function AccessibilitySettings() {
  const { settings, updateSettings } = useKeepsake();
  const acc = settings.accessibility || {};

  const update = (patch) => updateSettings({ accessibility: { ...acc, ...patch } });

  return (
    <div className="rounded-2xl bg-card border border-border divide-y divide-border">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4">
        <div className="flex min-w-[11rem] flex-1 items-start gap-3">
          <Type size={18} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Text size</p>
            <p className="text-xs text-muted-foreground mt-0.5">Make all text larger for easier reading</p>
          </div>
        </div>
        <Select value={acc.textSize || 'normal'} onValueChange={(v) => update({ textSize: v })}>
          <SelectTrigger className="ml-auto h-9 w-auto min-w-[7rem] shrink-0" aria-label="Text size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="large">Large</SelectItem>
            <SelectItem value="xlarge">Extra large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4">
        <div className="flex min-w-[11rem] flex-1 items-start gap-3">
          <Contrast size={18} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">High contrast</p>
            <p className="text-xs text-muted-foreground mt-0.5">Stronger borders and darker text for clarity</p>
          </div>
        </div>
        <Switch
          className="ml-auto shrink-0"
          checked={acc.highContrast || false}
          onCheckedChange={(v) => update({ highContrast: v })}
          aria-label="High contrast"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4">
        <div className="flex min-w-[11rem] flex-1 items-start gap-3">
          <Eye size={18} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Reduce motion</p>
            <p className="text-xs text-muted-foreground mt-0.5">Minimize animations and transitions</p>
          </div>
        </div>
        <Switch
          className="ml-auto shrink-0"
          checked={acc.reduceMotion || false}
          onCheckedChange={(v) => update({ reduceMotion: v })}
          aria-label="Reduce motion"
        />
      </div>
    </div>
  );
}