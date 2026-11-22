import React, { useState, useContext } from 'react';
import FbIcon from '@/components/icons/FbIcon';
import { KeepsakeContext } from '@/lib/keepsakeStore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import NotificationsSheet from './NotificationsSheet';

// Bell icon with an unread badge. Opens a bottom sheet listing the in-app
// notification feed. Opening the sheet marks all items as read (after a brief
// delay so the badge is visible while the sheet animates in).
// Gracefully renders nothing when rendered outside KeepsakeProvider (public
// pages like Privacy/Terms/ThankYou that use TopNav but have no store).
export default function NotificationBell({ size = 22, className = '' }) {
  const ctx = useContext(KeepsakeContext);
  const [open, setOpen] = useState(false);
  if (!ctx) return null;
  const { notifications } = ctx;
  const unread = notifications.filter((n) => !n.read && !n.completed).length;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
      }}
    >
      <SheetTrigger asChild>
        <button className={`flex items-center justify-center ${className}`} aria-label="Notifications">
          <div className="relative">
            <FbIcon name="notification" style="color" size={size} />
            {unread > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80dvh] flex flex-col">
        <NotificationsSheet />
      </SheetContent>
    </Sheet>
  );
}