import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useI18n } from "@/lib/i18n/I18nContext";

// The reset service answers the same way for every address, so a refusal (too
// many requests, an address it cannot mail) would otherwise look like success.
const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPassword() {
  const { t } = useI18n();
  // Arriving from the verification screen with an address already known.
  const [email, setEmail] = useState(
    () => new URLSearchParams(window.location.search).get("email") || ""
  );
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestLink = async (e) => {
    if (e) e.preventDefault();
    // A space picked up by autofill makes the request for a different address,
    // and the service still answers "sent".
    const clean = email.trim();
    setError("");
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(clean);
      setSentTo(clean);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const status = err?.status;
      setError(status === 429 ? t('auth.tooManyCodes') : (err.message || t('auth.resetFailedMsg2')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title={t('auth.resetPassword')}
      subtitle={t('auth.forgotDesc2')}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />{t('auth.backToLogin2')}
        </Link>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {sentTo ? (
        <div className="space-y-4">
          <p className="text-sm text-foreground text-center">
            {t('auth.resetSentDesc2')}
          </p>
          <p className="text-sm font-medium text-center break-all">{sentTo}</p>

          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2 text-xs text-muted-foreground">
            <p>
              The link is sent by our sign-in service, not from the FinBump address your
              other emails come from — it may be in your spam folder.
            </p>
            <p>
              If you sign in with Google, Microsoft, Facebook or Apple, there is no password
              to reset: use that button on the sign-in screen.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={requestLink}
            disabled={loading || cooldown > 0}
            className="w-full h-11 rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('auth.sending')}
              </>
            ) : cooldown > 0 ? (
              t('auth.resendIn', { seconds: cooldown })
            ) : (
              "Send the link again"
            )}
          </Button>

          <button
            type="button"
            onClick={() => { setSentTo(""); setCooldown(0); setError(""); }}
            className="block mx-auto text-xs text-primary font-medium hover:underline"
          >
            Use a different email address
          </button>
        </div>
      ) : (
        <form onSubmit={requestLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.emailAddress')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('auth.sending')}
              </>
            ) : (
              t('auth.sendLink')
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}