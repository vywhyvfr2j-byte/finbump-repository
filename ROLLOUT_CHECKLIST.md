# Keepsake — Chronological Rollout Checklist

## Phase 1 — Pre-Rollout (now → launch)

### Security & access hardening
- [ ] Audit every backend function for auth + admin role checks
- [ ] Move Premium AI message limits server-side (close client-side bypass)
- [ ] Confirm SUPPORT_EMAIL is a registered app user, or connect a custom domain
- [ ] Verify RLS on every entity — spot-check cross-user reads
- [ ] Confirm create-checkout stays public; payments-webhook grants on a webhook-written field, not is_verified

### Native build + push credentials
- [ ] Apple: active Developer Program membership + generate APNs auth key (.p8)
- [ ] Android: create Firebase project (free Spark plan) + download credentials
- [ ] Generate App Store files with "Add push notifications" enabled; upload both credential sets
- [ ] Confirm send-daily-push-notifications probe stops returning push_not_configured

### Payments verification (use Test database)
- [ ] Run full checkout → webhook → access-granted flow in Test mode
- [ ] Re-register webhook with ORDER_APPROVED, SUBSCRIPTION_CANCELED, SUBSCRIPTION_ENDED
- [ ] Test subscription cancellation → confirm access revoked
- [ ] Verify Thank You return route loads publicly

### Workflows — confirm all active
- [ ] Daily Digest (8:00am CT) — active
- [ ] Daily Push Notifications (8:30am CT) — active
- [ ] Analytics Cleanup — active
- [ ] Scaling Milestone Alert (weekly) — active
- [ ] Upgrade Ideas Reminder (bi-weekly) — active

### Content, legal, store assets
- [ ] Privacy Policy + Terms current
- [ ] App Store + Google Play screenshots, descriptions, age rating
- [ ] Custom domain connected
- [ ] Tagline finalized on login/onboarding

### Final QA (Test database)
- [ ] Onboarding flow completes
- [ ] Partner pairing + friend connections share correctly
- [ ] All themes render; seasonal icons show on Home
- [ ] No sideways scroll at mobile breakpoint

## Phase 2 — Launch / Rollout
- [ ] Publish native builds to App Store + Google Play
- [ ] Confirm Production database is the live target
- [ ] Watch first-day analytics for crashes / failed API calls
- [ ] Confirm webhook deliveries (ORDER_APPROVED) landing
- [ ] Confirm push notifications delivering to real devices
- [ ] Monitor SupportMessage inbox for first-user issues
- [ ] Verify daily digest emails land (check spam/promotions)

## Phase 3 — Post-Rollout / Scaling
### Growth monitoring
- [ ] Watch active-user count toward 3,000-user milestone
- [ ] Shard Daily Digest + Daily Push workflows near threshold
- [ ] Confirm Resend handling bulk email

### Credit & cost management
- [ ] Monitor integration credit burn (InvokeLLM, SendEmail, SendPush, GenerateImage/Video)
- [ ] Review daily encouragement LLM cost per user
- [ ] Audit cleanup-old-analytics is purging on schedule

### Feature & quality loop
- [ ] Process cancel requests promptly
- [ ] Manage access codes / family pass codes
- [ ] Review FutureUpgrade backlog via bi-weekly reminders
- [ ] Fix "Find It" terminology conflict
- [ ] Gate Premium features server-side
- [ ] Watch for useKeepsake HMR error in production logs

### Retention & support
- [ ] Track feature usage in Analytics dashboard
- [ ] Respond to SupportMessage entries within 48h
- [ ] Re-export data for account-deletion requests (GDPR/CCPA)
- [ ] Periodically re-test checkout + cancellation flow