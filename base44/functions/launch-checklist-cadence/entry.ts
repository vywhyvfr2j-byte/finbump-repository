import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { findAdminWithEmail } from "../../shared/adminRecipient.ts";

// Resolves the admin recipient for the weekly app launch checklist reminder
// (every Thursday 8am America/Chicago, four consecutive weeks, then stops —
// the stop is enforced by the workflow's ends_after_count). The workflow's
// send_email step does the actual send so the template stays editable in the
// Emails tab.
//
// Security: requires an admin via base44.auth.me(). The workflow's
// invoke_backend_function activity runs as the platform service role, which
// provides an admin-level auth context. Direct calls from non-admins return 403.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Resolve recipient: first admin user's email, fallback to SUPPORT_EMAIL.
    const adminUser = await findAdminWithEmail(base44);
    const to = adminUser?.email || process.env.SUPPORT_EMAIL;

    return Response.json({ send: true, to: to || null });
  } catch (error) {
    console.error('launch-checklist-cadence error', error?.message || error);
    return Response.json({ error: 'Could not resolve checklist recipient.' }, { status: 500 });
  }
}