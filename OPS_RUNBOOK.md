# Keepsake Operations Runbook

## Purpose

This runbook covers everything the owner/manager needs to keep Keepsake running
smoothly when paying customers depend on it — especially when an app update is
stuck in Apple/Google review and you can't ship a fix for days.

---

## 1. Required Tools & Access

The owner/manager must have ready access to ALL of the following **before** the
app goes live with paying customers:

| Tool | What it's for | Where |
|------|--------------|-------|
| **Base44 Builder** | Edit AppConfig, manage entities, run backend functions | app.base44.com |
| **AppConfig entity** | Kill switches, status banner, version gate, maintenance mode | Settings → Plan → Ops Control Panel (admin only) |
| **Base44 Payments dashboard** | View purchases, subscriptions, refunds | Base44 sidebar → Payments |
| **Apple App Store Connect** | Submit updates, view review status, respond to reviews | appstoreconnect.apple.com |
| **Google Play Console** | Submit updates, staged rollout, view crashes | play.google.com/console |
| **Crash reporting** | Crash-free session rate (halt-rule metric) | App Store Connect / Play Console → Crashes |
| **Support inbox** | User support tickets (SUPPORT_EMAIL secret) | Your email client |
| **This runbook** | Step-by-step incident response | OPS_RUNBOOK.md in the repo |

**Access checklist (verify before launch):**
- [ ] You can log into Base44 Builder and see the Ops Control Panel in Settings
- [ ] You can create/update the AppConfig record (admin role confirmed)
- [ ] You have App Store Connect and Google Play Console credentials
- [ ] You know the current APP_VERSION in `src/lib/appConfig.js`
- [ ] SUPPORT_EMAIL secret is set and is a registered Base44 user
- [ ] Wix Payments webhook is registered (ORDER_APPROVED + SUBSCRIPTION_CANCELED + SUBSCRIPTION_ENDED)

---

## 2. Remote Kill Switch / Feature Flags

**This is the single highest-leverage tool on this list.**

Every non-core feature is wrapped in a `<FeatureGate>` that checks the
`AppConfig.featureFlags` map. A broken feature you can disable in 30 seconds
is a **Sev 2**. The same feature requiring an app release is a **five-day Sev 1**.

### How to disable a broken feature

1. Open the app → Settings → Plan → **Ops Control Panel**
2. Scroll to **Feature flags (kill switches)**
3. Toggle the broken feature OFF
4. Tap **Save flags**
5. Users see "Temporarily unavailable" within ~5 minutes (the app polls
   AppConfig every 5 min and on app foreground)

### Feature flag reference

| Flag key | Feature | Core? |
|----------|---------|-------|
| `aiMessageWriter` | AI Message Writer | No |
| `aiGiftFinder` | AI Gift Finder / Recommendations | No |
| `aiTripIdeas` | AI Trip Ideas | No |
| `dailyEncouragement` | Daily AI stories/scripture | No |
| `vacationPlanner` | Vacation Planner | No |
| `giftTracker` | Gift Tracker / Find It | No |
| `prayerPage` | Care & Prayer | No |
| `milestones` | Milestones | No |
| `personalNotes` | Personal Notes | No |
| `relationshipGoals` | Relationship Goals | No |
| `progressChart` | Progress Analytics | No |
| `scheduleCalendar` | Schedule Calendar | No |
| `chatAssistant` | Chat Assistant | No |
| `partnerSync` | Partner Sync / Pairing | No |
| `friendConnections` | Friend Connections | No |

**Core features (never gated):** Home dashboard, Acts of support, People/contacts,
Events/special dates, Settings, authentication.

---

## 3. Server-Controlled Status Banner

When something is broken but the app still works, push a status message so users
know you're on it — this prevents 1-star reviews and support tickets.

### How to push a status message

1. Settings → Plan → **Ops Control Panel**
2. Under **Status banner**, type your message (e.g. *"We're aware of an issue
   with gift syncing, working on it."*)
3. Choose severity: Info (blue), Warning (amber), Critical (red)
4. **Save config**
5. To clear: empty the message field and save

---

## 4. Minimum-Version Gate

When a broken build is live and you can't push a fix immediately, force users
off the broken version:

1. Settings → Plan → **Ops Control Panel**
2. Under **Minimum version**, enter the lowest safe version (e.g. `1.0.1`)
3. **Save config**
4. Users on versions below this see a blocking "Update required" screen with a
   reload button — no data loss, just a gate

**Important:** Bump `APP_VERSION` in `src/lib/appConfig.js` with every release so
the gate has something to compare against.

---

## 5. Maintenance Mode

For full outages or database migrations:

1. Settings → Plan → **Ops Control Panel**
2. Toggle **Maintenance mode** ON
3. **Save config**
4. All users see a "Under maintenance" screen — your data is safe

---

## 6. Staged Rollout

### Procedure (every release)

1. **Submit** the new build to Apple and Google
2. Once approved, set **Rollout percentage** to **1%** in the Ops Control Panel
3. Monitor for 24 hours:
   - Crash-free sessions ≥ 99.5%
   - Support volume not doubled
   - No new 1-star reviews mentioning the new version
4. If green: increase to **10%**, monitor 24h
5. If green: increase to **50%**, monitor 24h
6. If green: increase to **100%**

### Halt rule

**Halt the rollout immediately if ANY of the following:**
- Crash-free sessions drop below **99.5%**
- Support ticket volume **doubles** vs. baseline
- Any data-loss report confirmed
- App Store / Play Store rating drops below **4.0** for the new version

**To halt:**
1. Set Rollout percentage back to the last-known-good value (e.g. 10% → back to 1%)
2. If the build itself is broken: set Minimum version to the last stable version
3. Push a status banner explaining the issue
4. Submit a hotfix and restart the rollout from 1%

---

## 7. Offline Mode & Write Queue

The app is designed so an outage is a **non-event**, not a 1-star review:

- **Read-only / offline mode:** If the backend is unreachable, the app shows
  the last-known-good cached data (from localStorage) with an amber "You're
  offline" banner — never a permanent spinner or an empty screen.
- **Queued writes:** When a write fails, it's saved to a local queue and
  retried with exponential backoff + jitter (2s → 4s → 8s → … → 5 min cap).
  The user sees "Saved" immediately (optimistic update); the sync happens
  silently when connectivity returns.
- **Backoff + jitter:** Each retry delay includes 0–1s of random jitter so
  every client doesn't reconnect at the same moment when the server comes back.

**What the user sees during an outage:**
- Data they already had: ✅ visible (cached)
- New edits: ✅ saved locally, shown as "will sync when online"
- No spinner, no empty screen, no "your data vanished"

---

## 8. Incident Response Procedures

### Sev 1 — App broken for all users (data loss, auth failure, crash on launch)

1. **Assess:** Can users open the app at all?
2. **If no:** Enable Maintenance Mode → push a status banner → investigate
3. **If a specific feature is broken:** Disable it via the kill switch (Sev 2)
4. **If a specific build is broken:** Set Minimum version to the last stable
5. **Communicate:** Push a status banner; email affected users if data was lost
6. **Fix:** Submit a hotfix build; use staged rollout from 1%
7. **Post-mortem:** Document root cause, detection time, resolution time

### Sev 2 — One feature broken, app otherwise usable

1. **Disable the feature** via the Ops Control Panel kill switch (30 seconds)
2. **Push a status banner** if users might notice
3. **Investigate** and fix in the next release
4. **Re-enable** the feature flag when fixed (no app release needed)

### Sev 3 — Minor bug, cosmetic issue

1. Log it
2. Fix in the next scheduled release
3. No emergency action needed

---

## 9. Monitoring Checklist (daily when paying customers are live)

- [ ] Crash-free session rate ≥ 99.5% (App Store Connect / Play Console)
- [ ] No spike in support tickets
- [ ] AppConfig record exists and is reachable (no "offline" banner for you)
- [ ] Wix Payments webhook is firing (check Base44Purchase records have `paid` status)
- [ ] No new 1-star reviews mentioning a specific broken feature
- [ ] Daily digest / push notification workflow ran (check DigestSnapshot records)

---

## 10. Pre-Release Checklist (before every submission)

- [ ] Bump `APP_VERSION` in `src/lib/appConfig.js`
- [ ] Test the offline mode: turn off network, verify cached data shows
- [ ] Test the write queue: make an edit offline, reconnect, verify it syncs
- [ ] Test the version gate: set minimumVersion above APP_VERSION, verify gate
- [ ] Test the kill switch: disable a feature flag, verify "Temporarily unavailable"
- [ ] Verify the status banner renders at each level (info/warning/critical)
- [ ] Confirm all auth flows work (login, register, OTP, reset, Google/Apple)
- [ ] Confirm checkout flow works (create-checkout → Wix → ThankYou → access granted)
- [ ] Submit to Apple and Google; do NOT release until both approve
- [ ] Once approved: start staged rollout at 1%

---

## 11. Customer Communication Templates

### Status banner (in-app)
> "We're aware of an issue with [feature], working on it. Your data is safe."

### Maintenance mode
> "Keepsake is undergoing a quick tune-up. We'll be back shortly — your data is safe."

### Version gate
> "This version of Keepsake is no longer supported. Please update to the latest version to continue."

### Email to affected users (data issue)
> "Hi [name], we identified an issue with [feature] on [date]. [What happened]. [What we fixed]. [What they should do]. We're sorry for the inconvenience. — The Keepsake team"

### App Store / Play Store review response
> "Hi [name], thanks for reporting this. We've identified the issue and a fix is on the way. Please update to the latest version when it's available. If you need immediate help, contact us at [support email]."