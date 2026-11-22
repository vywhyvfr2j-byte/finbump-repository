import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Award } from 'lucide-react';

// Shows the member's founding-member number and the day they signed up. The
// number is assigned by the server from the reserved founding emails and the
// sign-up order, so it is read here, never chosen: a member who has no number
// yet (signed up after the last run) gets one the first time this opens.
export default function FoundingMemberCard() {
  const [member, setMember] = useState(null);
  const [joinedAt, setJoinedAt] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const user = await base44.auth.me();
      if (!user || cancelled) return;
      setJoinedAt(user.created_date || '');

      const read = async () => {
        const rows = await base44.entities.Member.filter({ userId: user.id });
        return (Array.isArray(rows) ? rows : rows?.items || [])[0] || null;
      };

      let record = await read();
      if (!record) {
        await base44.functions.invoke('assign-member-numbers', {});
        record = await read();
      }
      if (!cancelled) setMember(record);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!joinedAt) return null;

  const joinedLabel = format(new Date(joinedAt), 'MMMM d, yyyy');

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Award size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Founding Member</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {member?.number ? (
              <>
                Member No. <span className="font-mono font-semibold text-foreground">#{member.number}</span>
              </>
            ) : (
              'Member number being issued'
            )}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Member since {joinedLabel}</p>
    </div>
  );
}