import React, { useMemo } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { actStatus } from '@/lib/keepsakeUtils';

// Computes a 0-100 "relationship health" score for a person based on
// their acts' completion status. The score rewards on-time completions
// and penalizes overdue acts, giving a quick visual snapshot of how
// well the user is keeping up with this relationship.
//
// Score = average of per-act scores:
//   fresh  = 100  (completed within the cycle)
//   soon   = 75   (due soon — still good)
//   overdue = 30  (past due — needs attention)
//   idle   = 20   (never done)
// Acts with notify=false are excluded (the user opted out of tracking).
export function computeHealthScore(acts, personId, personName) {
  const personActs = acts.filter(
    (a) => (a.personId === personId || a.person === personName) && a.notify !== false
  );
  if (personActs.length === 0) return null;

  const scoreMap = { fresh: 100, soon: 75, overdue: 30, idle: 20 };
  let total = 0;
  for (const act of personActs) {
    total += scoreMap[actStatus(act)] ?? 50;
  }
  return Math.round(total / personActs.length);
}

// Color and label for a given score, used by both the ring and the badge.
export function healthMeta(score) {
  if (score === null) return { color: '#94a3b8', label: 'No acts', bg: 'bg-muted' };
  if (score >= 80) return { color: '#10b981', label: 'Thriving', bg: 'bg-emerald-100' };
  if (score >= 60) return { color: '#f59e0b', label: 'Good', bg: 'bg-amber-100' };
  if (score >= 40) return { color: '#f97316', label: 'Needs attention', bg: 'bg-orange-100' };
  return { color: '#ef4444', label: 'Overdue', bg: 'bg-red-100' };
}

// Compact circular progress ring showing the health score. Used in
// PersonCard and PersonProfilePanel headers.
export default function RelationshipHealthScore({ personId, personName, size = 36 }) {
  const { acts } = useKeepsake();
  const score = useMemo(() => computeHealthScore(acts, personId, personName), [acts, personId, personName]);

  if (score === null) return null;

  const meta = healthMeta(score);
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
      title={`Relationship health: ${score}/100 — ${meta.label}`}
      aria-label={`Relationship health score ${score} out of 100, ${meta.label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={meta.color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute font-display text-[10px] font-semibold"
        style={{ color: meta.color }}
      >
        {score}
      </span>
    </div>
  );
}