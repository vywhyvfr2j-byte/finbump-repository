import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// A drop-down that opens as a bottom sheet on phones, so the list sits within
// thumb reach inside the iOS wrapper instead of hanging from the top of the
// screen. Wider screens keep the standard menu.
//
// options: [{ value, label }] — label may be plain text or a small node.
// groups:  [{ label, options }] — the same list split into titled sections.
export default function ResponsiveSelect({
  value,
  onValueChange,
  options = [],
  groups = [],
  placeholder,
  ariaLabel,
  title,
  className,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const sections = groups.length
    ? groups.filter((group) => group.options?.length)
    : [{ label: null, options }];
  const current = sections
    .flatMap((section) => section.options)
    .find((option) => option.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className} aria-label={ariaLabel}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {sections.map((section, index) => (
            <SelectGroup key={section.label ?? index}>
              {section.label && <SelectLabel>{section.label}</SelectLabel>}
              {section.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm",
          className
        )}
      >
        <span className={cn("truncate text-left", !current && "text-muted-foreground")}>
          {current?.label ?? placeholder ?? ""}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[70dvh]">
          <DrawerHeader className="pb-2 text-left">
            <DrawerTitle className="text-base">{title || ariaLabel || placeholder}</DrawerTitle>
          </DrawerHeader>
          <div
            role="listbox"
            aria-label={ariaLabel}
            className="overflow-y-auto px-2 pb-[calc(1rem_+_env(safe-area-inset-bottom))]"
          >
            {sections.map((section, index) => (
              <div key={section.label ?? index}>
                {section.label && (
                  <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {section.label}
                  </p>
                )}
                {section.options.map((option) => {
                  const selected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onValueChange(option.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-base",
                        selected ? "bg-primary/10 font-medium" : ""
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{option.label}</span>
                      </span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}