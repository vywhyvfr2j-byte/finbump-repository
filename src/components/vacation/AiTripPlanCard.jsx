import React from 'react';
import { Sparkles } from 'lucide-react';

// Read-only rendering of a trip's AI-generated plan. Shared by the host
// (Travelers panel) and the traveler (public invite page) so both sides see
// the same destination ideas, itinerary, stays, and restaurants.

export default function AiTripPlanCard({ aiPlan }) {
  if (!aiPlan) return null;
  return (
    <div className="space-y-3 text-sm">
      {aiPlan.destination && <p className="font-display text-base font-semibold">{aiPlan.destination}</p>}
      {aiPlan.summary && <p className="text-muted-foreground leading-relaxed">{aiPlan.summary}</p>}
      {aiPlan.rationale && (
        <p className="text-xs text-primary/80 leading-relaxed rounded-lg bg-primary/5 p-2.5">{aiPlan.rationale}</p>
      )}
      {Array.isArray(aiPlan.itinerary) && aiPlan.itinerary.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Itinerary</p>
          <ul className="space-y-2">
            {aiPlan.itinerary.map((d, i) => (
              <li key={i} className="text-xs">
                <p className="font-medium">{d.day}{d.title ? ` — ${d.title}` : ''}</p>
                {Array.isArray(d.activities) && d.activities.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {d.activities.map((a, idx) => (
                      <li key={idx} className="flex gap-1.5"><span className="text-primary">·</span><span>{a}</span></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(aiPlan.stays) && aiPlan.stays.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Where to stay</p>
          <ul className="space-y-1">
            {aiPlan.stays.map((s, i) => (
              <li key={i} className="text-xs"><span className="font-medium">{s.name}</span>{s.why ? <span className="text-muted-foreground"> — {s.why}</span> : null}</li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(aiPlan.eats) && aiPlan.eats.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Where to eat</p>
          <ul className="space-y-1">
            {aiPlan.eats.map((s, i) => (
              <li key={i} className="text-xs"><span className="font-medium">{s.name}</span>{s.why ? <span className="text-muted-foreground"> — {s.why}</span> : null}</li>
            ))}
          </ul>
        </div>
      )}
      {aiPlan.budgetPerPerson && <p className="text-xs text-muted-foreground">Budget per person: {aiPlan.budgetPerPerson}</p>}
      {Array.isArray(aiPlan.alternatives) && aiPlan.alternatives.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Backup destinations</p>
          <ul className="space-y-1">
            {aiPlan.alternatives.map((a, i) => (
              <li key={i} className="text-xs"><span className="font-medium">{a.destination}</span>{a.why ? <span className="text-muted-foreground"> — {a.why}</span> : null}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}