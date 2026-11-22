import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';

// Returns a map of lowercased contact-email -> true for contacts whose email
// belongs to an existing FinBump user. Fetched once after contacts load, then
// cached until the set of contact emails changes.
export function useKeepsakeUsers() {
  const { people } = useKeepsake();
  const [keepsakeEmails, setKeepsakeEmails] = useState({});
  const emailKey = people
    .map((p) => (p.email || '').trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(',');

  useEffect(() => {
    const emails = emailKey ? emailKey.split(',') : [];
    if (!emails.length) {
      setKeepsakeEmails({});
      return;
    }
    let cancelled = false;
    base44.functions.invoke('check-keepsake-users', { emails })
      .then((res) => {
        if (!cancelled) setKeepsakeEmails(res?.data?.users || {});
      })
      .catch(() => { if (!cancelled) setKeepsakeEmails({}); });
    return () => { cancelled = true; };
  }, [emailKey]);

  return keepsakeEmails;
}