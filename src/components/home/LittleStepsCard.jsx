import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Footprints } from 'lucide-react';
import { useLittleSteps } from '@/hooks/useLittleSteps';
import { useKeepsake } from '@/lib/keepsakeStore';
import { LITTLE_STEPS } from '@/lib/littleSteps';
import { isPracticeDone } from '@/lib/littleStepsPractice';
import { useToast } from '@/components/ui/use-toast';

// Little Steps — the guided start, one hands-on lesson at a time.
//
// A lesson is not finished by opening its screen: the card watches for the
// result of the gesture (a box checked, a date saved, a note written) and only
// offers to close the lesson once the app can see it. It sits directly under
// the Today list so a lesson never covers or displaces something that is due,
// and it only appears on a lesson day.
export default function LittleStepsCard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { acts, events, milestones, giftIdeas, people, pets, personalNotes } = useKeepsake();
  const {
    loading, lesson, lessonNumber, total, stopped, snoozed,
    complete, snooze, stop,
  } = useLittleSteps();

  if (loading || stopped || snoozed || !lesson) return null;

  const practice = lesson.practice || {};
  const done = isPracticeDone(practice.check, {
    acts, events, milestones, giftIdeas, people, pets, personalNotes,
  });

  const finish = () => {
    complete(lesson.day);
    const nextDay = LITTLE_STEPS.find((l) => l.day > lesson.day)?.day;
    toast({
      title: `That is lesson ${lessonNumber} of ${total}`,
      description: nextDay ? `The next one arrives on day ${nextDay}.` : 'That was the last one.',
    });
  };

  return (
    <div className="px-5 mt-4">
      <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
            <Footprints size={16} />
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Little Steps
          </span>
          <span className="ml-auto text-[11px] font-medium text-muted-foreground">
            Lesson {lessonNumber} of {total}
          </span>
        </div>

        <h2 className="font-display text-lg font-semibold leading-snug">{lesson.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{lesson.body}</p>

        <ol className="mt-3 space-y-1.5">
          {lesson.steps.map((step, i) => (
            <li key={step} className="flex gap-2 text-sm text-foreground">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary/60 text-[11px] font-semibold shrink-0">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        {/* The practice itself: named up front, then confirmed by the app once
            the gesture has really been saved. */}
        <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 ${done ? 'bg-primary/10' : 'bg-muted/60'}`}>
          {done ? (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground shrink-0">
              <Check size={13} />
            </span>
          ) : (
            <span className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/50 shrink-0" />
          )}
          <span className={`text-xs font-medium ${done ? 'text-primary' : 'text-muted-foreground'}`}>
            {done ? practice.done : practice.label}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {done
            ? 'FinBump can see it. Close the lesson whenever you are ready.'
            : 'FinBump ticks this off by itself once it has been saved.'}
        </p>

        {done ? (
          <button
            onClick={finish}
            className="mt-3 w-full flex items-center justify-center gap-1.5 min-h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-medium shadow-sm"
          >
            Finish this lesson
            <Check size={16} />
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate(lesson.route)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 min-h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-medium shadow-sm"
            >
              {lesson.cta}
              <ArrowRight size={16} />
            </button>
            <button
              onClick={finish}
              className="w-full text-xs font-medium text-muted-foreground mt-2.5"
            >
              I have already done this
            </button>
          </>
        )}

        <div className="flex items-center justify-center gap-4 mt-2.5">
          <button onClick={snooze} className="text-xs font-medium text-muted-foreground">Not now</button>
          <span className="text-xs text-muted-foreground/50">·</span>
          <button onClick={stop} className="text-xs font-medium text-muted-foreground">Stop these lessons</button>
        </div>
      </div>
    </div>
  );
}