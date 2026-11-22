import { useEffect } from 'react';
import { recordNotificationPermission } from '@/lib/notificationPermission';

// Records the notification permission state once per session so the daily
// permission rate has a denominator (active users), not just the people who
// were prompted that day.
export function useNotificationPermissionTracking() {
  useEffect(() => {
    recordNotificationPermission();
  }, []);
}