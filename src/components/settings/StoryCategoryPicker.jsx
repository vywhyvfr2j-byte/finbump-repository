import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import ResponsiveMenu from '@/components/ui/responsive-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  STORY_CATEGORIES,
  SUGGESTED_CATEGORIES,
  STORY_CATEGORY_LABELS,
} from '@/lib/content/storyCategories';

// Dropdown-with-checkboxes for picking which "A true story" categories the
// daily feed draws from. Empty selection means "all categories".
export default function StoryCategoryPicker({ value, onChange }) {
  const selected = Array.isArray(value) ? value.filter(Boolean) : [];
  const allSelected = selected.length === 0;
  const triggerLabel = allSelected
    ? 'All categories'
    : selected.length === 1
      ? STORY_CATEGORY_LABELS[selected[0]] || selected[0]
      : `${selected.length} categories selected`;

  const toggle = (key) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <ResponsiveMenu
      title="Story categories"
      contentClassName="w-[320px] p-0"
      trigger={
        <Button variant="outline" className="h-11 w-full justify-between font-normal">
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown size={16} className="opacity-60" />
        </Button>
      }
    >
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium">Story categories</span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-primary hover:underline"
          >
            {allSelected ? 'Clear all' : 'Reset to all'}
          </button>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1">
          {STORY_CATEGORIES.map((c) => {
            const checked = allSelected || selected.includes(c.key);
            return (
              <label
                key={c.key}
                className="flex min-h-12 items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/40 cursor-pointer"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => {
                    if (allSelected) {
                      // First explicit choice: start from only this category.
                      onChange([c.key]);
                    } else {
                      toggle(c.key);
                    }
                  }}
                />
                <span className="text-sm">{c.label}</span>
                {allSelected && (
                  <Check size={14} className="ml-auto text-primary opacity-80" />
                )}
              </label>
            );
          })}
        </div>
        <div className="p-3 border-t border-border bg-muted/40">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            Suggested other categories
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_CATEGORIES.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            We can break these out into their own filters on request.
          </p>
        </div>
    </ResponsiveMenu>
  );
}