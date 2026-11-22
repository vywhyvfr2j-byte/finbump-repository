import React from 'react';
import { Link } from 'react-router-dom';
import { Footprints, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLittleSteps } from '@/hooks/useLittleSteps';

// The way back into Little Steps: where the user is in the series, the lesson
// emails on or off, and a fresh start for anyone who stopped or finished and
// wants to go through it again.
export default function LittleStepsSettings() {
  const {
    loading, doneCount, total, finished, stopped, restart,
  } = useLittleSteps();

  if (loading) return null;

  const status = stopped
    ? 'Stopped'
    : finished
      ? `All ${total} lessons done`
      : `${doneCount} of ${total} lessons done`;

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
          <Footprints size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Little Steps</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Short hands-on lessons across your first three months, right inside the app.
          </p>
          <p className="text-xs font-medium text-primary mt-1.5">{status}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/60 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">
          Lesson emails are paused for now. Each lesson appears in the app, and in your
          notifications, when you open it.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={restart}
        className="w-full h-11 rounded-xl mt-4"
      >
        {stopped ? 'Start Little Steps again' : finished ? 'Go through Little Steps again' : 'Start over from lesson 1'}
      </Button>

      <Link
        to="/little-steps"
        className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-primary"
      >
        <Printer size={14} /> Printable list of the lessons
      </Link>
    </div>
  );
}