import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import BrandLogo from "@/components/BrandLogo";
import CarePillars from "@/components/auth/CarePillars";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { continueMfa, loginWithMfa, loginWithSocial } from "@/lib/authMfa";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerify(false);
    setLoading(true);
    try {
      // The platform answers with a token, or with a challenge when the account
      // protects itself with a second step (two-factor). The challenge has to be
      // carried on to that step — dropping it left sign-in with nothing to show.
      const result = await loginWithMfa(email.trim(), password);
      if (result?.access_token) {
        // Adopt the session that was just issued and continue inside the app
        // instead of reloading the whole page to discover it.
        await checkUserAuth();
        navigate(safeReturnTo(), { replace: true });
        return;
      }
      await continueMfa(result, safeReturnTo());
    } catch (err) {
      const message = err?.message || "";
      // Signing in before verifying fails — offer a fresh code instead of a
      // dead end, and carry the address over to the code screen.
      setNeedsVerify(/verif/i.test(message));
      setError(message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewCode = async () => {
    setError("");
    setResending(true);
    try {
      await base44.auth.resendOtp(email);
      window.location.href = `/register?verify=${encodeURIComponent(email)}`;
    } catch (err) {
      // Base44Error exposes .status; there is no axios .response on it.
      const status = err?.status;
      setError(status === 429 ? t('auth.tooManyCodes') : (err.message || t('auth.failedResend')));
    } finally {
      setResending(false);
    }
  };

  // Provider sign-in goes through the second-step-aware path, so an account
  // with two-factor on is not sent straight back to this screen.
  const handleGoogle = () => {
    loginWithSocial("google", safeReturnTo());
  };

  const handleApple = () => {
    loginWithSocial("apple", safeReturnTo());
  };

  return (
    <AuthLayout
      hero={
        <div className="text-center mb-8">
          <BrandLogo size={56} className="mb-4" />
          <h1 className="font-display text-2xl font-semibold leading-tight mb-1">{t('care.headline')}</h1>
          <p className="text-sm text-muted-foreground mb-5">{t('care.subheadline')}</p>
          <CarePillars className="max-w-[260px] mx-auto" />
        </div>
      }
      footer={
        <>
          {t('auth.noAccount')}{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('auth.createOne')}
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-3"
        onClick={handleApple}
      >
        <AppleIcon className="w-5 h-5 mr-2" />
        {t('auth.continueApple')}
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        {t('auth.continueGoogle')}
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t('auth.or')}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {needsVerify && (
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium mb-4"
          onClick={handleSendNewCode}
          disabled={resending}
        >
          {resending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.sendingCode')}
            </>
          ) : (
            t('auth.emailNewCode')
          )}
        </Button>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.loggingIn')}
              </>
              ) : (
              t('auth.login')
          )}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground mt-6">
        {t('auth.byContinuing')}{" "}
        <Link to="/privacy" className="text-primary hover:underline">{t('auth.privacyPolicy')}</Link>
        {" "}{t('auth.and')}{" "}
        <Link to="/terms" className="text-primary hover:underline">{t('auth.termsOfUse')}</Link>
        .
      </p>
    </AuthLayout>
  );
}