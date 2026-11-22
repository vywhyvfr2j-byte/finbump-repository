import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { loginWithSocial } from "@/lib/authMfa";
import { useI18n } from "@/lib/i18n/I18nContext";

// A code is only sent on demand, and resending too fast makes the auth service
// refuse it — so the button waits a little before it can be pressed again.
const RESEND_COOLDOWN_SECONDS = 30;

export default function Register() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifyFailed, setVerifyFailed] = useState(false);
  // One address for the whole sign-up: a stray space or capital letter picked up
  // by autofill would otherwise be sent to the code service as a different
  // address than the one the code was issued for.
  const cleanEmail = email.trim().toLowerCase();
  // True when the address already has a working account. No verification code can
  // ever be accepted for such an account, so it must not be sent to the code screen.
  const [existingAccount, setExistingAccount] = useState(false);

  // Arriving from the login screen, for an account that still needs verifying:
  // the address is known, so the code screen opens straight away.
  useEffect(() => {
    const pending = new URLSearchParams(window.location.search).get("verify");
    if (pending) {
      setEmail(pending);
      setShowOtp(true);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Requests a fresh code. The service answers honestly, so a refusal (usually
  // too many requests) is shown instead of a "sent" message for an email that
  // will never arrive.
  const sendCode = async () => {
    setError("");
    setResending(true);
    try {
      await base44.auth.resendOtp(cleanEmail);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      // A new code replaces the old one, so any digits already entered belong
      // to a code that no longer works.
      setOtpCode("");
      setVerifyFailed(false);
      toast({
        title: t('auth.codeSent'),
        description: t('auth.checkEmailCode'),
      });
      return true;
    } catch (err) {
      // The SDK raises a Base44Error carrying .status — not an axios response.
      const status = err?.status;
      setError(status === 429 ? t('auth.tooManyCodes') : (err.message || t('auth.failedResend')));
      return false;
    } finally {
      setResending(false);
    }
  };

  // Asks the sign-in service what this address really is, because nothing else
  // tells the truth: sign-up answers "Registration successful, check your email"
  // even for an address that already has a verified account, and sends no code
  // in that case. The code screen built on that reply alone is what traps people
  // in "Invalid or expired verification code" forever. Sign-in answers honestly:
  // in, refused (an existing account with another password) or awaiting a code.
  const signInAttempt = async () => {
    try {
      const result = await base44.auth.loginViaEmailPassword(cleanEmail, password);
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
        // Continue into the app with the session just issued, in place.
        await checkUserAuth();
        navigate(safeReturnTo(), { replace: true });
        return 'signed_in';
      }
      return 'refused';
    } catch (err) {
      return /verif/i.test(err?.message || '') ? 'awaiting_verification' : 'refused';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExistingAccount(false);
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDontMatch'));
      return;
    }
    setLoading(true);
    try {
      // Already a working account with this password? Then this is a sign-in.
      const before = await signInAttempt();
      if (before === 'signed_in') return;
      if (before === 'awaiting_verification') {
        const sent = await sendCode();
        if (sent) {
          setShowOtp(true);
          setError(t('auth.accountExists'));
        }
        return;
      }

      await base44.auth.register({ email: cleanEmail, password });

      // A brand-new account now answers sign-in with "please verify"; an address
      // that already had a working account keeps answering "invalid or
      // password", which means no code will ever be accepted for it.
      const after = await signInAttempt();
      if (after === 'signed_in') return;
      if (after === 'awaiting_verification') {
        setShowOtp(true);
        return;
      }
      setExistingAccount(true);
    } catch (err) {
      const status = err?.status;
      setError(status === 429 ? t('auth.tooManyCodes') : (err.message || t('auth.registrationFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: cleanEmail, otpCode: otpCode.trim() });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // A verified account is signed in already — pick the session up and land
      // on the app rather than reloading the page to find it.
      await checkUserAuth();
      navigate(safeReturnTo(), { replace: true });
    } catch (err) {
      const message = err.message || 'That code was not accepted.';
      setVerifyFailed(true);
      setOtpCode("");
      // Before handing out yet another code, find out whether a code can work at
      // all for this address. An address that answers sign-in with "invalid email
      // or password" already has a verified account, and every code it is sent
      // will be rejected — so it needs a sign-in or a reset, not more digits.
      const state = password ? await signInAttempt() : 'awaiting_verification';
      if (state === 'signed_in') return;
      if (state === 'refused') {
        setShowOtp(false);
        setExistingAccount(true);
        setError(message);
        return;
      }
      const sent = await sendCode();
      setError(sent ? `${message} We've just emailed a new code — enter the newest one.` : message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0 || resending) return;
    sendCode();
  };

  const handleGoogle = () => {
    loginWithSocial("google", safeReturnTo());
  };

  const handleApple = () => {
    loginWithSocial("apple", safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title={t('auth.verifyEmail')}
        subtitle={t('auth.weSentCode', { email: cleanEmail })}
        footer={
          <>
            {t('auth.alreadyVerified')}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t('auth.logIn')}
            </Link>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        {verifyFailed && (
          <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-2">{t('auth.recoveryHint')}</p>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-medium"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.sendingCode')}
                </>
              ) : cooldown > 0 ? (
                t('auth.resendIn', { seconds: cooldown })
              ) : (
                t('auth.sendNewCode')
              )}
            </Button>
            <div className="flex items-center justify-center gap-3 pt-2 text-xs">
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t('auth.loginInstead')}
              </Link>
              <Link
                to={`/forgot-password?email=${encodeURIComponent(cleanEmail)}`}
                className="text-primary font-medium hover:underline"
              >
                {t('auth.resetInstead')}
              </Link>
            </div>
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup className="gap-1">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="h-12 w-10 text-lg font-semibold rounded-lg border border-border bg-card text-foreground shadow-card"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.verifying')}
              </>
              ) : (
              t('auth.verify')
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('auth.didntReceive')}{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="text-primary font-medium hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {cooldown > 0
              ? t('auth.resendIn', { seconds: cooldown })
              : t('auth.resend')}
          </button>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-3">
          {t('auth.codeHint')} Each code is only good for 10 minutes and only the newest
          one works, so if an older email is sitting above it in your inbox, use the one
          that arrived last.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={t('auth.createAccount')}
      subtitle={t('auth.registerDesc')}
      footer={
        <>
          {t('auth.haveAccount')}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('auth.logIn')}
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

      {existingAccount && (
        <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3 space-y-2">
          <p className="text-sm font-medium text-foreground">
            This email already has an account
          </p>
          <p className="text-xs text-muted-foreground">
            A verification code is only needed for a brand-new account. Sign in with your
            existing password, or reset it if you can't remember it.
          </p>
          <div className="flex items-center gap-4 text-xs pt-1">
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
            <Link
              to={`/forgot-password?email=${encodeURIComponent(cleanEmail)}`}
              className="text-primary font-medium hover:underline"
            >
              Reset password
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" onChange={() => setExistingAccount(false)}>
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
          <Label htmlFor="password">{t('auth.password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.creatingAccount')}
              </>
              ) : (
              t('auth.createAccount')
          )}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground mt-6">
        {t('auth.byCreating')}{" "}
        <Link to="/privacy" className="text-primary hover:underline">{t('auth.privacyPolicy')}</Link>
        {" "}{t('auth.and')}{" "}
        <Link to="/terms" className="text-primary hover:underline">{t('auth.termsOfUse')}</Link>
        .
      </p>
    </AuthLayout>
  );
}