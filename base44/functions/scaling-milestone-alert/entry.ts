import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { listAll } from "../../shared/batchProcess.ts";
import { isResendConfigured, sendEmailViaResend } from "../../shared/resendEmail.ts";
import { secrets } from "base44:runtime";

// Alert when the user count reaches this — gives lead time before the 3,000-user
// sharding milestone. Adjust this single constant to change the trigger point.
const ALERT_THRESHOLD = 2500;

// Scheduled by the "Scaling Milestone Alert" workflow (weekly, Monday 9am CT).
// Counts app users and, once the count crosses ALERT_THRESHOLD, emails the admin
// a single notification describing the requirement and the exact solution to
// implement (sharding the two daily batch workflows). Idempotent: a marker in
// AppConfig.featureFlags prevents repeat emails.
//
// Security: admin-only via base44.auth.me(). The workflow's invoke_backend_function
// activity runs as the platform service role (admin-level auth context).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const users = await listAll(base44.asServiceRole.entities.User);
    const count = users.length;

    // Idempotency marker lives in the existing AppConfig.featureFlags map.
    const configs = await base44.asServiceRole.entities.AppConfig.list();
    const config = configs[0];
    const alreadySent = config?.featureFlags?.scalingShardAlertSent3k === true;

    if (count < ALERT_THRESHOLD) {
      return Response.json({ ok: true, count, threshold: ALERT_THRESHOLD, alerted: false, alreadySent });
    }
    if (alreadySent) {
      return Response.json({ ok: true, count, threshold: ALERT_THRESHOLD, alerted: false, alreadySent: true });
    }

    const perShard = Math.ceil(count / 4);
    const subject = `FinBump scaling action required: shard the daily batch jobs at ${count} users`;
    const body = [
      'REQUIREMENT',
      `FinBump now has ${count} users. The two daily batch jobs — the Daily Digest email and the Daily Push Notifications — each load every user's records in a single function run. Past ~3,000 users a single run risks exceeding the 5-minute function timeout and hitting shared service-role rate limits.`,
      '',
      'Sharding is ALREADY implemented in the code: both send-scheduled-digest and send-daily-push-notifications accept { shard, totalShards } and process only their slice. No code change is needed — only the workflow definitions must be updated to call each function multiple times with different shard indices.',
      '',
      'SPECIFIC SOLUTION TO IMPLEMENT',
      `1. Daily Digest workflow (base44/workflows/Daily Digest.jsonc):`,
      '   - Replace the single invoke_backend_function step with 4 steps, each calling send-scheduled-digest with args:',
      '     { shard: 0, totalShards: 4 }, { shard: 1, totalShards: 4 }, { shard: 2, totalShards: 4 }, { shard: 3, totalShards: 4 }',
      '   - Stagger each shard by 30 minutes (add a wait step between them) to reduce rate-limit contention.',
      '',
      `2. Daily Push Notifications workflow (base44/workflows/Daily Push Notifications.jsonc):`,
      '   - Same pattern: 4 steps calling send-daily-push-notifications with { shard: i, totalShards: 4 }.',
      '   - Keep the 30-minute stagger between shards.',
      '',
      `3. Choose N so each shard processes ~1,000 or fewer users. With ${count} users, N=4 gives ~${perShard} users per shard. Re-evaluate N at the next milestone (e.g. shard to 8 at ~6,000 users).`,
      '',
      '4. After updating, each function response includes shard / totalShards / shardedOut so you can verify coverage in the workflow run log.',
      '',
      'This alert fires once. The marker is stored in AppConfig.featureFlags.scalingShardAlertSent3k; clear it there to re-arm the alert.',
    ].join('\n');

    const to = secrets.get('SUPPORT_EMAIL') || user.email;
    let sent = false;
    if (isResendConfigured()) {
      sent = await sendEmailViaResend(to, subject, body);
      if (!sent) throw new Error('Resend send failed');
    } else {
      await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body });
      sent = true;
    }

    // Stamp the marker so this only emails once.
    const flags = { ...(config?.featureFlags || {}) };
    flags.scalingShardAlertSent3k = true;
    if (config?.id) {
      await base44.asServiceRole.entities.AppConfig.update(config.id, { featureFlags: flags });
    } else {
      await base44.asServiceRole.entities.AppConfig.create({ featureFlags: flags });
    }

    return Response.json({ ok: true, count, threshold: ALERT_THRESHOLD, alerted: true, sentTo: to });
  } catch (error) {
    console.error('scaling-milestone-alert error', error?.message || error);
    return Response.json({ error: 'Could not send the scaling alert.' }, { status: 500 });
  }
}