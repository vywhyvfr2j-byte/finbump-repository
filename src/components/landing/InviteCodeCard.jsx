import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { KeyRound, Loader2 } from 'lucide-react';

// Where someone who was handed an invite code enters it from the landing page.
// The code can only be redeemed by a signed-in account (validate-access-code
// reads the session), so a visitor who isn't signed in yet has the code held
// here while they create the account or sign in, and it is redeemed the moment
// they come back to this page with a session.
const PENDING_CODE_KEY = 'ks_pending_invite_code';

const RETURN_TO = `/login?returnTo=${encodeURIComponent('/welcome')}`;
const REGISTER_TO = `/register?returnTo=${encodeURIComponent('/welcome')}`;

export default function InviteCodeCard() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const autoRan = useRef(false);

  const redeem = async (value) => {
    setChecking(true);
    setError('');
    try {
      const res = await base44.functions.invoke('validate-access-code', { code: value });
      const denied = res?.data?.error;
      if (denied) {
        setError(denied);
        setChecking(false);
        return;
      }
      try { sessionStorage.removeItem(PENDING_CODE_KEY); } catch {}
      // Full reload so the app re-checks access with the freshly granted account.
      window.location.href = '/';
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'That code did not work. Please check it and try again.');
      setChecking(false);
    }
  };

  // Coming back from sign-in or sign-up with a code still waiting: redeem it.
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    let pending = '';
    try { pending = sessionStorage.getItem(PENDING_CODE_KEY) || ''; } catch {}
    if (!pending) return;
    setCode(pending);
    base44.auth.isAuthenticated().then((signedIn) => {
      if (signedIn) redeem(pending);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value || checking) return;
    setError('');
    setChecking(true);
    const signedIn = await base44.auth.isAuthenticated();
    if (signedIn) {
      redeem(value);
      return;
    }
    try { sessionStorage.setItem(PENDING_CODE_KEY, value); } catch {}
    setChecking(false);
    navigate(REGISTER_TO);
  };

  return (
    <section aria-labelledby="invite-code-heading" className="border-t border-border bg-muted/40">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-10 md:py-12">
        <div className="mx-auto max-w-[34rem] rounded-3xl border border-border bg-card p-6 text-center shadow-card md:p-8">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound size={19} aria-hidden="true" />
          </span>
          <h2 id="invite-code-heading" className="mt-3 font-display text-xl font-semibold">
            Have a code to get in?
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            Enter the code someone shared with you and we&rsquo;ll unlock your account.
          </p>

          <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="invite-code" className="sr-only">
              Your access code
            </label>
            <input
              id="invite-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="YOUR CODE"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="one-time-code"
              spellCheck={false}
              disabled={checking}
              className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-center text-base font-medium uppercase tracking-[0.28em] text-foreground placeholder:tracking-[0.18em] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={checking || !code.trim()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50 sm:w-auto"
            >
              {checking ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Checking
                </>
              ) : (
                'Unlock my account'
              )}
            </button>
          </form>

          {error && (
            <p role="alert" className="mt-3 text-[13px] font-medium text-destructive">
              {error}
            </p>
          )}

          <p className="mt-4 text-[12.5px] text-muted-foreground">
            Already have an account?{' '}
            <Link to={RETURN_TO} className="font-medium text-primary hover:underline">
              Sign in
            </Link>{' '}
            · No account yet?{' '}
            <Link to={REGISTER_TO} className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}