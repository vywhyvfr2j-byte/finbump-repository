# Keepsake — Pre-Publish Change Checklist

**Run this checklist after EVERY change or addition, before publishing.**
The goal: the app works properly at all times, with zero customer
experience interruption. If any item fails, do not publish.

> **How to use:** Work top to bottom. Items marked **always** apply to every
> change. Items marked **if touched** apply only when that area was modified.
> Check each box in the Base44 builder preview (tablet + mobile breakpoints)
> before tapping Publish.

---

## 1. Build & Compile (always)

- [ ] **No build errors** — the builder preview loads without a red error banner
- [ ] **No console errors** on the home route (`preview_execute_code` →
      `consoleLogs({ level: 'error' })` returns zero entries)
- [ ] **No unresolved imports** — no "module not found" warnings in the build
- [ ] **App.jsx routes intact** — every page you changed still has a `<Route>`;
      removed pages have their route deleted (no dead routes)
- [ ] **No sideways scroll** at mobile and tablet widths
      (`document.documentElement.scrollWidth <= clientWidth + 2`)

## 2. Page-by-Page Rendering (always for touched pages)

For each page you added or modified, open it in the preview and confirm:

- [ ] Page renders content (not a blank screen, not the scaffold 404)
- [ ] Loading state shows while data fetches, then real content appears
- [ ] Empty state shows when no data exists (not a blank card)
- [ ] `TopNav` title is correct; back button returns to the previous page
- [ ] `BottomNav` highlights the correct tab
- [ ] No layout shift or content jump after data loads
- [ ] Text is legible — no ink over busy images without a scrim

## 3. Links & Navigation (always)

- [ ] Every `<Link to="...">` points to a route that exists in `App.jsx`
- [ ] Every redirect (`<Navigate to="..." replace />`) lands on a real page
- [ ] Bottom-nav items all resolve to their pages
- [ ] Deep links from notifications (`route` field) point to real routes
- [ ] External links (affiliate, buy links) open in a new tab and carry the
      FTC affiliate disclosure where required
- [ ] The `*` catch-all route still redirects to `/`

## 4. Backend Functions & Services (if touched)

- [ ] **Test the function** with `test_backend_function` — response is 200,
      payload matches the expected shape, no error in the logs
- [ ] **Auth check** — the function enforces the right role (admin-only for
      ops functions; user-scoped for user data; public only for `create-checkout`)
- [ ] **No Core integration calls in client code** — all `InvokeLLM`,
      `SendEmail`, `TranscribeAudio`, etc. run inside backend functions via
      `base44.asServiceRole.integrations.Core`
- [ ] **Pagination** — any function that scans users or entities at scale
      is paginated (sub-3s response at 15k+ users)
- [ ] **Secrets** — any new secret is declared via `set_secrets` and read by
      literal name (`process.env.MY_SECRET`), never dynamically

## 5. Workflows (if touched)

- [ ] Workflow status is **active** (not paused) after the edit
- [ ] `get_workflow_run` shows the latest run succeeded with no errors
- [ ] Triggers fire at the expected cadence (check the schedule expression)
- [ ] No duplicate workflows doing the same job

## 6. Performance & Speed (always)

- [ ] **Home route loads in under 3 seconds** in the preview
- [ ] **No unbounded list queries** — entity `.list()` calls are sorted and
      limited (e.g. `.list('-created_date', 50)`)
- [ ] **Lazy-loaded collections** — optional entities load via
      `useEnsureEntities`, not on app mount
- [ ] **No N+1 queries** — bulk operations (`bulkCreate`, `bulkUpdate`) are
      used instead of loops of single operations
- [ ] **Images use the `Image` component** (served resized/WebP with srcset),
      not raw `<img>` tags
- [ ] **No blocking LLM calls on render** — AI features show a loading state
      and never block the page from rendering
- [ ] **Animations don't jank** — framer-motion transitions are short
      (≤0.2s) and use `easeOut`

## 7. User Experience Consistency (always)

- [ ] **Brand tokens used** — colors via `bg-primary`, `text-muted-foreground`,
      etc.; no hardcoded hex values (`bg-[#fff]`, inline `style` colors)
- [ ] **Fonts correct** — headings use `font-display` (Fraunces), body uses
      `font-body` (Inter)
- [ ] **Buttons have titles** — every action button has a visible label or
      accessible `title` (the `useButtonTitles` hook derives them, but verify)
- [ ] **Toast feedback** — create/update/delete actions show a toast
      confirmation
- [ ] **Optimistic updates** — writes show the change immediately; the write
      queue retries silently if offline
- [ ] **Offline mode** — turn off network in the preview; cached data still
      shows with the amber "You're offline" banner (no spinner, no blank)
- [ ] **Accessibility** — high-contrast and reduce-motion settings still
      apply; interactive elements have visible focus rings
- [ ] **Mobile layout** — at 375px width, no horizontal scroll, no clipped
      text, tap targets are ≥44px

## 8. Data Integrity (if touched entities or persistence)

- [ ] **Schema is complete** — entity `.jsonc` has all fields, no
      placeholders or comments
- [ ] **RLS rules intact** — create/read/update/delete rules match the
      ownership pattern; a non-admin user can only see their own records
- [ ] **No orphaned records** — deleting a parent (e.g. a Person) cleans up
      or unlinks child records (goals, gifts, events)
- [ ] **No data loss on migration** — if a field was renamed or removed,
      existing records still load without errors
- [ ] **Test in Test database first** — if `data_env="dev"` is available,
      create a test record, verify the flow, then delete it

## 9. Payments & Auth (if touched)

- [ ] **Checkout is public** — `create-checkout` never gates on
      `base44.auth.me()` or returns 401
- [ ] **Access gated on webhook-written field** — never on `is_verified`
      (platform-protected, locks buyers out)
- [ ] **Webhook registered** — `ORDER_APPROVED` + `SUBSCRIPTION_CANCELED` +
      `SUBSCRIPTION_ENDED` all subscribed (re-register if unsure)
- [ ] **Return routes public** — `/ThankYou`, `/privacy`, `/terms` load
      without authentication
- [ ] **Auth flows** — login, register, OTP, reset, Google/Apple all complete
      and redirect to the intended page
- [ ] **Access gate** — un-approved users see the `AccessGate`; admins bypass

## 10. Credit & Cost Alignment (always)

- [ ] **No new LLM calls without a limit** — every `InvokeLLM` / AI feature
      has a daily per-user cap (check `AiUsageDaily` + `aiRateLimit` shared
      module) aligned with the company credit budget
- [ ] **No new email sends without a reason** — `SendEmail` calls are for
      digests, support, or transactional events only; no spam loops
- [ ] **No new push sends without opt-in** — `SendPushNotification` only
      fires for users with `pushNotifications: true` in their preferences
- [ ] **No new image/video generation without a cap** — `GenerateImage` and
      `GenerateVideo` are expensive; ensure a per-user or per-feature limit
- [ ] **Cleanup workflows active** — `cleanup-old-analytics` and
      `rollup-daily-analytics` are running so `AnalyticsEvent` records don't
      accumulate unbounded cost
- [ ] **Test database used for verification** — never run AI/email/push
      verification against Production data

## 11. Regression Check (always)

- [ ] **Home dashboard** — greeting, acts, reminders, encouragement all load
- [ ] **Notifications bell** — opens the sheet, shows current feed, count
      badge is accurate
- [ ] **One act completion** — complete an act, verify it persists and the
      feed updates
- [ ] **One create flow** — add a person/gift/event/note, verify it saves and
      appears in its list
- [ ] **One delete flow** — delete the test record you just created, verify
      it's removed
- [ ] **Settings page** — opens, all sections render, no runtime errors
- [ ] **No `useKeepsake must be used within KeepsakeProvider` errors** in the
      console (HMR artifact — refresh the preview to confirm it's transient)

## 12. Final Go/No-Go (always)

- [ ] All **always** items above are checked
- [ ] All **if touched** items for the areas you modified are checked
- [ ] No item is skipped or "will fix later"
- [ ] You've tested in the **Test database** if any data flow changed
- [ ] `APP_VERSION` is bumped in `src/lib/appConfig.js` if this is a published
      release (so the version gate can protect users if a rollback is needed)
- [ ] **Publish.** Then watch the first 15 minutes in the preview for any
      runtime error that only appears on the live bundle.

---

## Quick Reference — Speed Targets

| Metric | Target |
|--------|--------|
| Home route first paint | < 3s |
| Backend function response | < 3s at 15k users |
| Entity list query | sorted + limited (≤50) |
| LLM call | loading state shown, never blocks render |
| Animation duration | ≤ 0.2s |
| Offline fallback | cached data + amber banner, no spinner |

## Quick Reference — Credit Budget

| Integration | Cost | Guardrail |
|-------------|------|----------|
| `InvokeLLM` (default model) | 1 credit/call | Per-user daily cap per feature |
| `InvokeLLM` (non-default model) | More credits | Only when needed; tell the user |
| `SendEmail` | 1 credit/email | Transactional/digest only |
| `SendPushNotification` | 1 credit/push | Opt-in users only |
| `GenerateImage` | credits/image | Per-feature limit |
| `GenerateVideo` | 5 credits/second | Per-feature limit |
| `TranscribeAudio` | credits/min | Only when voice feature is used |

**Policy:** every AI/email/push integration must have a per-user daily cap
enforced server-side via the `AiUsageDaily` entity and `aiRateLimit` shared
module. Client-side caps are a UX hint, not a guardrail.