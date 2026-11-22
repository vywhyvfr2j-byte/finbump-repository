import React from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { colorFor } from '@/lib/groupConstants';

// Small colored chips showing which groups a connection belongs to, shown on
// the person profile header. Each chip links to that group's detail page.
export default function PersonGroupBadges({ personId }) {
  const { groups } = useKeepsake();
  const mine = (groups || []).filter((g) => (g.memberIds || []).includes(personId));
  if (!mine.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-1.5 mt-2">
      {mine.map((g) => {
        const c = colorFor(g.color);
        return (
          <Link
            key={g.id}
            to={`/groups/${g.id}`}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${c.chip}`}
          >
            <span className="leading-none">{g.emoji || '👥'}</span>
            {g.name}
          </Link>
        );
      })}
    </div>
  );
}