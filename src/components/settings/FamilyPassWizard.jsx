import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Gift, Ticket, Copy, Share2, Calendar, Check, ArrowRight, ArrowLeft, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Step-by-step wizard that guides a purchaser through sharing family
// pass codes. Replaces the old "generate + hope" flow with a clear
// 3-step process: choose pass type → label it → share it.
export default function FamilyPassWizard({ credits, onGenerate, onClose }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [passType, setPassType] = useState(null);
  const [label, setLabel] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const hasCredits = credits.annual > 0;
  if (!hasCredits) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await onGenerate(passType, label);
      if (result?.code) {
        setGeneratedCode(result.code);
        setStep(2);
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast({ title: 'Copied', description: code });
  };

  const shareCode = (code) => {
    const text = t('app.invitedPremium', { duration: '1 year', code });
    if (navigator.share) {
      navigator.share({ title: t('app.premiumPass'), text }).catch(() => {});
    } else {
      const url = `sms:?&body=${encodeURIComponent(text)}`;
      window.location.href = url;
    }
  };

  const reset = () => {
    setStep(0);
    setPassType(null);
    setLabel('');
    setGeneratedCode(null);
  };

  const steps = [
    // Step 0 — Choose pass type
    {
      title: 'Choose a pass type',
      content: (
        <div className="space-y-2.5">
          <p className="text-sm text-muted-foreground mb-3">Pick the Premium pass to share with your family or friend.</p>
          <button
            onClick={() => { setPassType('annual'); setStep(1); }}
            disabled={credits.annual <= 0}
            className="w-full flex items-center gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-secondary/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/15 shrink-0">
              <Calendar size={18} className="text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Annual pass</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('app.yearPremium')}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-lg font-semibold">{credits.annual}</p>
              <p className="text-[10px] text-muted-foreground">left</p>
            </div>
          </button>
        </div>
      ),
    },
    // Step 1 — Label and generate
    {
      title: 'Share an annual pass',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add a note so you remember who this pass is for (optional).
          </p>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Grandma's birthday gift"
            maxLength={40}
            className="h-12 text-base"
          />
          <div className="rounded-xl bg-secondary/40 border border-border p-3">
            <p className="text-xs text-muted-foreground">
              <Users size={14} className="inline mr-1.5" />
              {t('app.enterCodeInApp')}
            </p>
          </div>
        </div>
      ),
      cta: generating ? 'Generating…' : 'Generate pass code',
      canProceed: true,
    },
    // Step 2 — Share the generated code
    {
      title: 'Your pass code is ready!',
      content: (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Check size={30} className="text-primary" />
          </div>
          <div className="rounded-xl bg-accent/10 border border-accent/30 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Your pass code:</p>
            <code className="font-display text-2xl font-semibold tracking-wider block">{generatedCode}</code>
            {label && <p className="text-xs text-muted-foreground mt-2">For: {label}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => copyCode(generatedCode)} className="h-11">
              <Copy size={16} /> Copy
            </Button>
            <Button onClick={() => shareCode(generatedCode)} className="h-11">
              <Share2 size={16} /> Share
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Share this code via text or copy it. The recipient enters it in Settings → Plan → Redeem a pass.
          </p>
        </div>
      ),
      cta: 'Share another pass',
      canProceed: true,
    },
  ];

  const current = steps[step];

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift size={18} />
          <p className="font-display text-base font-semibold">Share a pass</p>
        </div>
        {step > 0 && (
          <button onClick={step === 2 ? reset : () => setStep(step - 1)} className="text-xs text-muted-foreground hover:text-foreground">
            {step === 2 ? 'Start over' : 'Back'}
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-primary' : 'w-1.5 bg-border'}`}
          />
        ))}
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold mb-3">{current.title}</h3>
        {current.content}
      </div>

      {step === 1 && (
        <Button
          onClick={handleGenerate}
          disabled={!current.canProceed || generating}
          className="w-full h-12 rounded-xl"
        >
          {current.cta}
          <ArrowRight size={18} className="ml-1.5" />
        </Button>
      )}

      {step === 2 && (
        <Button
          onClick={reset}
          variant="outline"
          className="w-full h-12 rounded-xl"
        >
          Share another pass
        </Button>
      )}

      <button onClick={onClose} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
        Close wizard
      </button>
    </div>
  );
}