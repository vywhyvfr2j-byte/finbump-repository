import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// A menu that drops from its trigger on wider screens and rises as a bottom
// sheet on phones, where the list sits within thumb reach instead of hanging
// from the top of the screen.
//
// `trigger` is the control the user taps, rendered as-is in both layouts.
// `children` may be a node, or a function that receives `close()` for items
// that should dismiss the menu once picked.
export default function ResponsiveMenu({
  trigger,
  title,
  children,
  align = 'start',
  contentClassName,
  bodyClassName,
  sheetClassName,
  open: controlledOpen,
  onOpenChange,
}) {
  const isMobile = useIsMobile();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (next) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const body = typeof children === 'function' ? children(() => setOpen(false)) : children;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className={cn('max-h-[80dvh]', sheetClassName)}>
          {title && (
            <DrawerHeader className="pb-2 text-left">
              <DrawerTitle className="text-base">{title}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className={cn('overflow-y-auto pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]', bodyClassName)}>
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} side="bottom" className={contentClassName}>
        {body}
      </PopoverContent>
    </Popover>
  );
}