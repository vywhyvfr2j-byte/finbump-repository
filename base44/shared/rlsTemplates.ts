/**
 * #10: Shared RLS templates for FinBump entities.
 *
 * RLS is defined per-entity in JSON schema files (base44/entities/*.jsonc),
 * which can't import TypeScript. This module serves as the single source of
 * truth for the standard RLS patterns: copy the matching template into each
 * entity's "rls" key, and never hand-edit the rules. When a new entity is
 * created, apply the right template here — don't copy-paste from a neighbor,
 * because one entity drifting to a looser rule is the most common security
 * hole.
 *
 * Templates:
 * 1. USER_DATA — the default for all user-owned content (acts, people, gifts,
 *    trips, etc.). Owner can do everything; admins can do everything.
 * 2. ADMIN_MANAGED — admin-only create/update/delete; public or user read
 *    (e.g. AppConfig, AccessCode).
 * 3. USER_CREATE_ADMIN_READ — any user can create; only admins can read/update/
 *    delete (e.g. SupportMessage, AnalyticsEvent).
 * 4. STRICT_OWNER — only the record owner can do anything, no admin override
 *    (e.g. DigestSnapshot).
 * 5. PAYMENT — admin-only create/update/delete; read by appUserId or owner or
 *    admin (e.g. Base44Purchase, CancelRequest).
 */

export const USER_DATA_RLS = {
  create: { $or: [{ created_by_id: '{{user.id}}' }, { user_condition: { role: 'admin' } }] },
  read: { $or: [{ created_by_id: '{{user.id}}' }, { user_condition: { role: 'admin' } }] },
  update: { $or: [{ created_by_id: '{{user.id}}' }, { user_condition: { role: 'admin' } }] },
  delete: { $or: [{ created_by_id: '{{user.id}}' }, { user_condition: { role: 'admin' } }] },
};

export const ADMIN_MANAGED_RLS = {
  create: { user_condition: { role: 'admin' } },
  update: { user_condition: { role: 'admin' } },
  delete: { user_condition: { role: 'admin' } },
};

export const USER_CREATE_ADMIN_READ_RLS = {
  create: { $or: [{ created_by_id: '{{user.id}}' }, { user_condition: { role: 'admin' } }] },
  read: { user_condition: { role: 'admin' } },
  update: { user_condition: { role: 'admin' } },
  delete: { user_condition: { role: 'admin' } },
};

export const STRICT_OWNER_RLS = {
  create: { created_by_id: '{{user.id}}' },
  read: { created_by_id: '{{user.id}}' },
  update: { created_by_id: '{{user.id}}' },
  delete: { created_by_id: '{{user.id}}' },
};

export const PAYMENT_RLS = {
  read: { $or: [{ 'data.appUserId': '{{user.id}}' }, { created_by_id: '{{user.id}}' }, { user_condition: { role: 'admin' } }] },
  create: { user_condition: { role: 'admin' } },
  update: { user_condition: { role: 'admin' } },
  delete: { user_condition: { role: 'admin' } },
};

/**
 * Entities using USER_DATA_RLS (must match exactly):
 *   Act, ActCompletion, BookIdea, CommLog, Event, FavoriteIdea, GiftIdea,
 *   Goal, Milestone, MovieIdea, Person, PersonalNote, Pet, PrayerRequest,
 *   SeriesIdea, TreatIdea, Trip, UserPreference
 *
 * Entities using ADMIN_MANAGED_RLS:
 *   AccessCode, AppConfig (AppConfig read is public: {})
 *
 * Entities using USER_CREATE_ADMIN_READ_RLS:
 *   AnalyticsEvent, SupportMessage
 *
 * Entities using STRICT_OWNER_RLS:
 *   DigestSnapshot
 *
 * Entities using PAYMENT_RLS:
 *   Base44Purchase, CancelRequest (CancelRequest create/read also allows data.userId)
 *
 * Entities with custom RLS (documented inline in the schema):
 *   PassCode — read/delete by owner, create/update admin-only
 */