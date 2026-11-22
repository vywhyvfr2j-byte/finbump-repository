import React, { useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import {
  Smartphone, Users, PawPrint, Heart, CalendarDays, Gift, HeartPulse,
  UsersRound, User, Plane, Sparkles, Settings, Bell, Sun, Zap, Utensils, Cake,
} from 'lucide-react';

const ICONS = {
  Smartphone, Users, PawPrint, Heart, CalendarDays, Gift, HeartPulse,
  UsersRound, User, Plane, Sparkles, Settings, Bell, Sun, Zap, Utensils, Cake, BookOpen,
};

export default function GuideLesson({ lesson, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = ICONS[lesson.icon] || BookOpen;

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full p-4 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary shrink-0">
          <Icon size={18} />
        </div>
        <span className="flex-1 text-sm font-semibold">{lesson.title}</span>
        <ChevronDown
          size={18}
          className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {lesson.steps.map((step, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                {step.heading}
              </p>
              <ul className="space-y-1">
                {step.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}