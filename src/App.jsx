import { useEffect, lazy, Suspense, useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import TabStacksSync from '@/components/TabStacksSync';
import SkipToContent from '@/components/SkipToContent';
import { KeepsakeProvider, useKeepsake } from '@/lib/keepsakeStore';
import { setQuietHoursPrefs } from '@/lib/quietHours';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { useDigestSnapshotSync } from '@/hooks/useDigestSnapshotSync';
import { useButtonTitles } from '@/hooks/useButtonTitles';
import { useNotificationPermissionTracking } from '@/hooks/useNotificationPermissionTracking';
import { useDailyEncouragement } from '@/hooks/useDailyEncouragement';
import { useThemeApplier } from '@/hooks/useThemeApplier';
import { useAccessibilityApplier } from '@/hooks/useAccessibilityApplier';
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Welcome = lazy(() => import('@/pages/Welcome'));
const Features = lazy(() => import('@/pages/Features'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Mfa = lazy(() => import('@/pages/Mfa'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Home = lazy(() => import('@/pages/Home'));
const ActDetail = lazy(() => import('@/pages/ActDetail'));
const PartnerProfile = lazy(() => import('@/pages/PartnerProfile'));
const Events = lazy(() => import('@/pages/Events'));
const Recommendations = lazy(() => import('@/pages/Recommendations'));
const AddAct = lazy(() => import('@/pages/AddAct'));
const SpecialDates = lazy(() => import('@/pages/SpecialDates'));
const Settings = lazy(() => import('@/pages/Settings'));
const GiftTracker = lazy(() => import('@/pages/GiftTracker'));
const Milestones = lazy(() => import('@/pages/Milestones'));
const PersonalNotes = lazy(() => import('@/pages/PersonalNotes'));
const RelationshipGoals = lazy(() => import('@/pages/RelationshipGoals'));
const RelationshipNotes = lazy(() => import('@/pages/RelationshipNotes'));
const MessageWriter = lazy(() => import('@/pages/MessageWriter'));
const VacationPlanner = lazy(() => import('@/pages/VacationPlanner'));
const People = lazy(() => import('@/pages/People'));
const Groups = lazy(() => import('@/pages/Groups'));
const GroupDetail = lazy(() => import('@/pages/GroupDetail'));
const Pets = lazy(() => import('@/pages/Pets'));
const MyProfile = lazy(() => import('@/pages/MyProfile'));
const ProgressHub = lazy(() => import('@/pages/ProgressHub'));
const IconPreview = lazy(() => import('@/pages/IconPreview'));
const ScheduleCalendar = lazy(() => import('@/pages/ScheduleCalendar'));
const FindIt = lazy(() => import('@/pages/FindIt'));
const FindItHub = lazy(() => import('@/pages/FindItHub'));
const Chat = lazy(() => import('@/pages/Chat'));
const Prayer = lazy(() => import('@/pages/Prayer'));
const ThankYou = lazy(() => import('@/pages/ThankYou'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const GrowthDashboard = lazy(() => import('@/pages/GrowthDashboard'));
const FutureUpgrades = lazy(() => import('@/pages/FutureUpgrades'));
const Reviews = lazy(() => import('@/pages/Reviews'));
const AboutUsPage = lazy(() => import('@/pages/AboutUs'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Search = lazy(() => import('@/pages/Search'));
const OAuthConsent = lazy(() => import('@/pages/OAuthConsent'));
const UserGuide = lazy(() => import('@/pages/UserGuide'));
const LittleStepsGuide = lazy(() => import('@/pages/LittleStepsGuide'));
const SuggestImprovement = lazy(() => import('@/pages/SuggestImprovement'));
const SavedItems = lazy(() => import('@/pages/SavedItems'));
const AppreciationCalendar = lazy(() => import('@/pages/AppreciationCalendar'));
const CardBuilder = lazy(() => import('@/pages/CardBuilder'));
const Cards = lazy(() => import('@/pages/Cards'));
const Meals = lazy(() => import('@/pages/Meals'));
const MealDetail = lazy(() => import('@/pages/MealDetail'));
const MealDashboard = lazy(() => import('@/pages/MealDashboard'));
const MealInvite = lazy(() => import('@/pages/MealInvite'));
const TripInvite = lazy(() => import('@/pages/TripInvite'));
const TripIdeaReview = lazy(() => import('@/pages/TripIdeaReview'));
const Occasions = lazy(() => import('@/pages/Occasions'));
const MemoryMoments = lazy(() => import('@/pages/MemoryMoments'));
const MemorySummary = lazy(() => import('@/pages/MemorySummary'));
const Remembering = lazy(() => import('@/pages/Remembering'));
const AdminInsights = lazy(() => import('@/pages/AdminInsights'));
const Paywall = lazy(() => import('@/pages/Paywall'));
const TrialDashboard = lazy(() => import('@/pages/TrialDashboard'));
const OnboardingPreview = lazy(() => import('@/pages/Onboarding'));

// Add legal + return-route public imports above (kept out of the auth gate so
// they load for buyers returning from Wix checkout and for prospective users).
import { I18nProvider } from '@/lib/i18n/I18nContext';
import { base44 } from '@/api/base44Client';
import BrandGradients from '@/components/BrandGradients';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import PageSkeleton from '@/components/PageSkeleton';
import AccessGate from '@/components/AccessGate';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import { AppHealthProvider } from '@/lib/AppHealthContext';
import AppHealthGate from '@/components/ops/AppHealthGate';
import StatusBanner from '@/components/ops/StatusBanner';
import FeatureGate from '@/components/ops/FeatureGate';
import PrivacyShieldGate from '@/components/privacy/PrivacyShieldGate';

// Runs the FinBump hooks + onboarding gate around the protected app routes
// (rendered as a layout via <Outlet />).
const FinBumpGate = () => {
  const { user } = useAuth();
  const { isLoaded, onboarded, refresh, acts, events, milestones, giftIdeas, people, pets, profile, settings, memoryRefreshes, personalNotes, myPreferences, adminInsights, setNotificationFeed, setDailyEncouragementContent, dailyEncouragementContent } = useKeepsake();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  useDailyEncouragement({ enabled: settings.dailyEncouragement, faithTradition: settings.faithTradition, scriptureSubject: settings.scriptureSubject, encouragementStory: settings.encouragementStory, encouragementMessage: settings.encouragementMessage, encouragementScripture: settings.encouragementScripture, storyCategories: settings.storyCategories, setContent: setDailyEncouragementContent });
  useInAppNotifications({ acts, events, milestones, giftIdeas, people, pets, profile, settings, dailyEncouragementContent, memoryRefreshes, personalNotes, myPreferences, adminInsights, setNotificationFeed });
  useDigestSnapshotSync();
  useButtonTitles();
  useNotificationPermissionTracking();
  useThemeApplier(settings.theme);
  useAccessibilityApplier();
  // Quiet hours: handed to the reminder hooks (which fire browser notifications)
  // through a module cache, so the window is known before their first effect.
  setQuietHoursPrefs(myPreferences);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    if (user.role === 'admin') { setHasAccess(true); setAccessChecked(true); return; }
    base44.functions.invoke('check-access', {})
      .then(res => { if (!cancelled) { setHasAccess(res?.data?.hasAccess ?? false); setAccessChecked(true); } })
      .catch(() => { if (!cancelled) { setHasAccess(false); setAccessChecked(true); } });
    return () => { cancelled = true; };
  }, [user]);
  const location = useLocation();
  const navigate = useNavigate();
  // Native-style page motion: a push slides the new screen in from the right,
  // going back slides it in from the left, so the direction always matches the
  // way the user moved. Reduce-motion turns it into a plain cross-fade.
  const navigationType = useNavigationType();
  const slideFrom = navigationType === 'POP' ? -1 : 1;
  const reduceMotion = !!settings?.accessibility?.reduceMotion;
  // After the 7-day free trial ends (or a monthly pass lapses), the user's
  // plan reverts to "free" with a past passExpiresAt. Show the paywall once
  // per expiry until they subscribe or dismiss — never for admins, lifetime
  // holders, or active paid subscribers.
  useEffect(() => {
    if (!user || user.role === 'admin') return;
    const pe = user.passExpiresAt;
    if (!pe || user.lifetimeTier) return;
    if (user.plan && user.plan !== 'free') return;
    if (new Date(pe).getTime() >= Date.now()) return;
    try {
      if (window.localStorage.getItem(`ks_paywall_dismissed_${pe}`)) return;
    } catch {}
    navigate('/paywall');
  }, [user]);
  if (!accessChecked) return <PageSkeleton />;
  if (!hasAccess) {
    // Before access, the plans screen stays reachable so a new member can start
    // the trial or pay. Every other route shows the sign-up gate.
    if (location.pathname === '/paywall') {
      return (
        <Suspense fallback={<PageSkeleton />}>
          <Paywall />
        </Suspense>
      );
    }
    return <AccessGate />;
  }
  if (!isLoaded) {
    return (
      <>
        <PageSkeleton />
        <BottomNav />
      </>
    );
  }
  if (!onboarded) return <Suspense fallback={<PageSkeleton />}><Onboarding /></Suspense>;
  return (
    <>
      <PrivacyShieldGate />
      <StatusBanner />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: slideFrom * 64 }}
          animate={{ opacity: 1, x: 0 }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0.1 } }
              : { opacity: 0, x: slideFrom * -32, transition: { duration: 0.16, ease: [0.32, 0.72, 0, 1] } }
          }
          transition={
            reduceMotion
              ? { duration: 0.12, ease: 'easeOut' }
              : { duration: 0.26, ease: [0.32, 0.72, 0, 1] }
          }
        >
          <RouteErrorBoundary>
            {/* Pull-to-refresh lives here so every screen that scrolls gets it,
                not just the few that wrapped themselves. The calendar is left
                out: it opens its own full-screen overlays, which the pull
                wrapper's transform would re-anchor. */}
            <PullToRefresh onRefresh={refresh} disabled={location.pathname === '/calendar'}>
              <main id="main-content" className="min-h-[60vh]">
                <Suspense fallback={<PageSkeleton />}>
                  <Outlet />
                </Suspense>
              </main>
            </PullToRefresh>
          </RouteErrorBoundary>
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </>
  );
};

const PublicSuspense = () => (
  <Suspense fallback={<PageSkeleton />}>
    <Outlet />
  </Suspense>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      const returnTo = window.location.pathname + window.location.search;
      // The app's root is the front door for people without an account: they see
      // the public landing page rather than a login wall. Every other deep link
      // still goes to login and comes back to where it was sent.
      // These are <Navigate> rather than a window.location assignment so the
      // redirect stays inside the router: the shell, the theme and the fonts are
      // already loaded, so the visitor lands on the page instead of watching a
      // full reload flash white.
      if (!returnTo || returnTo === '/') {
        return <Navigate to="/welcome" replace />;
      }
      // Send unauthenticated visitors to the in-app login (which offers Google + Apple).
      return (
        <Navigate
          to={returnTo !== '/login' ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'}
          replace
        />
      );
    }
    // Any other startup failure (for example the API being unreachable from
    // inside the native WebView) used to fall through and leave the screen
    // waiting with no explanation. Say what failed, so a test build shows its
    // own cause instead of only pulsing.
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="font-display text-lg font-semibold">FinBump couldn't start</p>
        <p className="text-sm text-muted-foreground">
          {authError.message || 'The app could not reach its server.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 min-h-[2.75rem] px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <AppHealthProvider>
      <AppHealthGate>
        <KeepsakeProvider>
          <FinBumpGate />
        </KeepsakeProvider>
      </AppHealthGate>
    </AppHealthProvider>
  );
};


// Keeps the `.dark` class on <html> in sync with the device's system color-scheme
// so Dark Mode renders correctly inside iOS WebViews (which ignore CSS-media-query
// dark-mode in some configs but reflect prefers-color-scheme to matchMedia).
function ThemeSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', mq.matches);
    apply();
    const handler = () => apply();
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeSync />
        <BrandGradients />
        <I18nProvider>
        <Router>
          <SkipToContent />
          <ScrollToTop />
          <TabStacksSync />
          <Routes>
            {/* Public auth screens — reachable without an account, so social
                sign-in (Google + Apple) is available in-app. */}
            <Route element={<PublicSuspense />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Second step at sign-in (two-factor) and its settings — public,
                  because it finishes a sign-in and asks for credentials itself. */}
              <Route path="/mfa" element={<Mfa />} />
              {/* Public landing page for prospective customers: what FinBump is,
                  what it costs, and the way in. */}
              <Route path="/welcome" element={<Welcome />} />
              {/* Public features page — every feature explained, so it can be
                  linked from the landing page and from outside the app. */}
              <Route path="/features" element={<Features />} />
              {/* Public legal + return pages — reachable without an account so
                  prospective users can read them and Wix-checkout buyers can land
                  after payment without bouncing to login. */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/ThankYou" element={<ThankYou />} />
              <Route path="/oauth/consent" element={<OAuthConsent />} />
              {/* Public meal invite page — invitees answer by personal token
                  link and may not have an account at all. */}
              <Route path="/meal-invite" element={<MealInvite />} />
              <Route path="/trip-invite" element={<TripInvite />} />
            </Route>

            {/* Everything else is gated by AuthenticatedApp + FinBumpGate. */}
            <Route element={<AuthenticatedApp />}>
              <Route path="/" element={<Home />} />
              <Route path="/acts" element={<ActDetail />} />
              <Route path="/acts/:actId" element={<ActDetail />} />
              <Route path="/profile" element={<PartnerProfile />} />
              <Route path="/events" element={<Navigate to="/calendar" replace />} />
              <Route path="/ideas" element={<FeatureGate feature="aiGiftFinder" premium><Recommendations /></FeatureGate>} />
              <Route path="/add-act" element={<AddAct />} />
              <Route path="/special-dates" element={<Navigate to="/calendar" replace />} />
              {/* History and Timeline now live inside the Progress & History
                  section — old links land on the matching tab. */}
              <Route path="/history" element={<Navigate to="/progress?tab=history" replace />} />
              <Route path="/timeline" element={<Navigate to="/progress?tab=timeline" replace />} />
              <Route path="/memory" element={<MemoryMoments />} />
              <Route path="/memory-summary" element={<FeatureGate feature="memorySummary" premium><MemorySummary /></FeatureGate>} />
              <Route path="/remembering" element={<FeatureGate feature="remembrance" premium><Remembering /></FeatureGate>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/gift-tracker" element={<FeatureGate feature="giftTracker"><GiftTracker /></FeatureGate>} />
              <Route path="/gift-ideas" element={<Navigate to="/gift-tracker" replace />} />
              <Route path="/milestones" element={<Navigate to="/relationship-notes" replace />} />
              <Route path="/personal-notes" element={<FeatureGate feature="personalNotes"><PersonalNotes /></FeatureGate>} />
              <Route path="/dashboard" element={<Navigate to="/calendar" replace />} />
              <Route path="/relationship-goals" element={<Navigate to="/relationship-notes" replace />} />
              <Route path="/relationship-notes" element={<RelationshipNotes />} />
              <Route path="/message-writer" element={<FeatureGate feature="aiMessageWriter"><MessageWriter /></FeatureGate>} />
              <Route path="/vacation-planner" element={<FeatureGate feature="vacationPlanner" premium><VacationPlanner /></FeatureGate>} />
            <Route path="/trip-idea" element={<FeatureGate feature="vacationPlanner" premium><TripIdeaReview /></FeatureGate>} />
              <Route path="/people" element={<People />} />
              <Route path="/occasions" element={<Occasions />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:groupId" element={<GroupDetail />} />
              <Route path="/pets" element={<Pets />} />
              <Route path="/me" element={<MyProfile />} />
              {/* Progress keeps its Premium gate inside the hub, so History and
                  Timeline stay available to everyone. */}
              <Route path="/progress" element={<ProgressHub />} />
              {/* Review screen for the new icon pack (admin/owner review). */}
              <Route path="/icon-preview" element={<IconPreview />} />
              <Route path="/schedule-calendar" element={<Navigate to="/calendar" replace />} />
              <Route path="/calendar" element={<FindIt />} />
            <Route path="/find-it" element={<FindItHub />} />
            <Route path="/saved-items" element={<SavedItems />} />
            <Route path="/appreciation-calendar" element={<AppreciationCalendar />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/card-builder" element={<CardBuilder />} />
            <Route path="/meals" element={<FeatureGate feature="groupMeals" premium><Meals /></FeatureGate>} />
            <Route path="/meals/dashboard" element={<FeatureGate feature="groupMeals" premium><MealDashboard /></FeatureGate>} />
            <Route path="/meals/:mealId" element={<FeatureGate feature="groupMeals" premium><MealDetail /></FeatureGate>} />
              <Route path="/search" element={<Search />} />
              <Route path="/chat" element={<FeatureGate feature="chatAssistant" premium><Chat /></FeatureGate>} />
              <Route path="/prayer" element={<FeatureGate feature="prayerPage"><Prayer /></FeatureGate>} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/growth" element={<GrowthDashboard />} />
              <Route path="/admin-insights" element={<AdminInsights />} />
              <Route path="/paywall" element={<Paywall />} />
              {/* The 7-day trial at a glance: days left, today's small wins. */}
              <Route path="/trial" element={<TrialDashboard />} />
              {/* Admin-only read-only preview of the new-user onboarding flow.
                  Renders the same Onboarding component with a flag that
                  disables saving, so the admin can review it end-to-end. */}
              <Route path="/onboarding" element={<OnboardingPreview adminPreview />} />
              <Route path="/future-upgrades" element={<FutureUpgrades />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/about-us" element={<AboutUsPage />} />
              <Route path="/user-guide" element={<UserGuide />} />
              <Route path="/little-steps" element={<LittleStepsGuide />} />
              <Route path="/suggest-improvement" element={<SuggestImprovement />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
        </I18nProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

// App.jsx owns the provider tree (AuthProvider → KeepsakeProvider → FinBumpGate).
// HMR on this file re-evaluates it, creating a new FinBumpGate that imports a
// fresh KeepsakeContext while the mounted KeepsakeProvider still holds the old
// one — causing "useKeepsake must be used within KeepsakeProvider". Declining
// HMR forces a clean full-page reload instead, matching keepsakeStore.jsx.
if (import.meta.hot) {
  import.meta.hot.decline();
}

export default App