import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Users } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { colorFor } from '@/lib/groupConstants';

export default function MyGroupsDropdown() {
  const { groups, people } = useKeepsake();
  const [open, setOpen] = useState(false);

  const count = (g) => (g.memberIds || []).length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <span className="flex items-center gap-2">
          <Users size={18} />
          <span className="text-sm font-semibold">My groups</span>
          <span className="text-xs text-muted-foreground">({(groups || []).length})</span>
        </span>
        <ChevronDown
          size={18}
          className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {(groups || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              No groups yet.{' '}
              <Link to="/groups" className="text-primary font-medium">Create one</Link>
            </p>
          ) : (
            (groups || []).map((g) => {
              const c = colorFor(g.color);
              return (
                <Link
                  key={g.id}
                  to={`/groups/${g.id}`}
                  className={`flex items-center gap-2.5 rounded-xl ${c.tile} px-3 py-2.5`}
                >
                  <span className="text-lg leading-none">{g.emoji || '👥'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{count(g)} {count(g) === 1 ? 'person' : 'people'}</p>
                  </div>
                </Link>
              );
            })
          )}
          <Link
            to="/groups"
            className="block text-center text-sm font-medium text-primary pt-1"
          >
            Manage all groups
          </Link>
        </div>
      )}
    </div>
  );
}