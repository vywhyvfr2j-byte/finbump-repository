import React from 'react';
import { Pencil, X } from 'lucide-react';
import RemembranceIcon from '@/components/icons/RemembranceIcon';
import useSignedPhotoUrls from '@/hooks/useSignedPhotoUrls';

function timing(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

// Everyone on the user's remembrance list, soonest date first. Each row shows
// how far away the next annual date is and how early the reminder begins, with
// quiet edit and stop actions beside it.
export default function RememberedList({ rows = [], onEdit, onStop }) {
  // Pictures kept with each date live in private storage, so they're shown
  // through short-lived signed URLs.
  const urls = useSignedPhotoUrls(rows.flatMap((row) => row.photos || []));

  return (
    <section aria-labelledby="remembered-heading" className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="remembered-heading" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <RemembranceIcon size={13} /> Dates you keep
        </h2>
        <span className="text-[11px] text-muted-foreground">{rows.length || 'No'} {rows.length === 1 ? 'date' : 'dates'}</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-5 text-center">
          <p className="text-sm font-medium">No remembrance dates yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add one below for anyone you would like to keep remembering.
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Only you can see this — nobody is notified or invited.
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl border border-border bg-card overflow-hidden">
          {rows.map((row) => (
            <li key={`${row.kind}-${row.id}`} className="flex items-start gap-3 px-4 py-3 border-b border-border/60 last:border-b-0">
              <div className="relative w-10 h-10 rounded-full bg-secondary/60 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {row.photos?.[0] && urls[row.photos[0]] ? (
                  // Signed private URL — used verbatim, since its signature is
                  // in the query string.
                  <img src={urls[row.photos[0]]} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <RemembranceIcon size={20} />
                )}
                {row.photos?.length > 1 && (
                  <span className="absolute bottom-0 right-0 text-[9px] leading-none font-medium px-1 py-0.5 rounded-full bg-card/90 text-muted-foreground border border-border">
                    +{row.photos.length - 1}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.next
                    ? `${timing(row.days)} · ${row.next.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`
                    : 'No date yet'}
                  {row.years ? ` · ${row.years} year${row.years === 1 ? '' : 's'}` : ''}
                </p>
                {row.note && <p className="text-xs text-muted-foreground mt-1">{row.note}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">
                  Reminder {row.lead === 0 ? 'on the day' : `${row.lead} day${row.lead === 1 ? '' : 's'} before`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="inline-flex items-center justify-center w-11 h-11 -m-1 rounded-full text-primary hover:bg-secondary/60"
                  aria-label={`Edit remembrance date for ${row.name}`}
                  title="Edit date"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onStop(row)}
                  className="inline-flex items-center justify-center w-11 h-11 -m-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary/60"
                  aria-label={`Stop remembering ${row.name}`}
                  title="Stop remembering"
                >
                  <X size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}