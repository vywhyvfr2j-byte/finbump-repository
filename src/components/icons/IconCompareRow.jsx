import React from 'react';
import FbIcon from '@/components/icons/FbIcon';

// One review row: the icon in place today, then the pack's colour and mono
// versions, so all three can be judged side by side at real size.
export default function IconCompareRow({ label, Current, fbIcon }) {
  const chip = 'flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/40 shrink-0';
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <span className="w-[6.5rem] text-[11px] leading-tight text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <span className={chip} title="Today">
          {Current ? <Current size={20} /> : <span className="text-[10px] text-muted-foreground">none</span>}
        </span>
        <span className={chip} title="New — colour">
          <FbIcon name={fbIcon} style="color" size={22} />
        </span>
        <span className={`${chip} text-primary`} title="New — mono">
          <FbIcon name={fbIcon} style="mono" size={20} />
        </span>
      </div>
    </div>
  );
}