import React from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Repeat, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shown right after the new user adds their first act of kindness during
// onboarding: confirms what was saved and who it's for, then asks whether they
// want another act — for the same person, or for someone else.
export default function FirstActCongrats({ actName, personName, addedCount = 1, onAddSamePerson, onAddSomeoneElse }) {
  const forWhom = personName ? `for ${personName}` : 'for everyone you care about';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="mx-auto w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center"
        >
          <PartyPopper size={34} aria-hidden="true" />
        </motion.div>
        <h2 className="font-display text-2xl font-semibold leading-tight">
          Nice — your first act of kindness is set up
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">{actName}</span> is saved {forWhom}. FinBump will
          nudge you when it's been a while, so it never slips your mind.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-center">Want to add another one?</p>
        <Button
          variant="outline"
          size="lg"
          onClick={onAddSamePerson}
          className="w-full min-h-14 py-3.5 text-base rounded-2xl whitespace-normal leading-snug justify-start text-left"
        >
          <Repeat size={18} className="mr-1.5 shrink-0" aria-hidden="true" />
          {personName ? `Another act of kindness for ${personName}` : 'Another act of kindness for the same people'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onAddSomeoneElse}
          className="w-full min-h-14 py-3.5 text-base rounded-2xl whitespace-normal leading-snug justify-start text-left"
        >
          <UserPlus size={18} className="mr-1.5 shrink-0" aria-hidden="true" />
          A new act of kindness for someone else
        </Button>
      </div>

      {addedCount > 1 && (
        <p className="text-center text-xs text-muted-foreground">
          {addedCount} acts of kindness set up so far
        </p>
      )}
    </div>
  );
}