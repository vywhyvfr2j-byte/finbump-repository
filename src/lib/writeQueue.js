// Local write queue with retry, exponential backoff, and jitter.
// When a backend entity write fails (network error, 5xx, etc.), the operation
// is saved to localStorage and retried with increasing delays + random jitter
// so a mass reconnect doesn't hammer the server all at once.

import { base44 } from '@/api/base44Client';
import { scopedKey } from '@/lib/accountCache';

// Per account, so a write queued by one person can never be replayed into the
// account that signs in on this browser next.
const QUEUE_KEY = 'keepsake_write_queue';
const MAX_RETRIES = 12;
const BASE_DELAY = 2000; // 2 seconds
const MAX_DELAY = 300000; // 5 minutes cap

// Methods that are fire-and-forget writes safe to queue.
const QUEUEABLE_METHODS = new Set(['create', 'update', 'delete', 'deleteMany', 'updateMany', 'bulkUpdate']);

// Creates are queued only for the collections where losing the record means
// losing something the user wrote or did — a memory moment, an appreciation
// note, a completed act, a logged conversation. Everywhere else a create stays
// fire-and-forget: a queued create returns no record, so the caller never learns
// the real id and keeps its optimistic placeholder.
const QUEUEABLE_CREATES = new Set(['PersonalNote', 'ActCompletion', 'MemoryRefresh', 'CommLog']);

// A retried create must not duplicate a record that was actually stored on an
// earlier attempt (the request timed out after the write landed). Each queued
// create carries the natural key below; the flush skips it if a matching record
// is already there. ActCompletion is keyed on its client-generated timestamp,
// which is exact.
const DEDUPE_KEYS = {
  ActCompletion: (r) => ({ actId: r.actId, completedAt: r.completedAt }),
  PersonalNote: (r) => ({
    text: r.text,
    type: r.type || 'general',
    ...(r.memoryDate ? { memoryDate: r.memoryDate } : {}),
  }),
  MemoryRefresh: (r) => ({ label: r.label, refreshAt: r.refreshAt }),
  CommLog: (r) => ({ text: r.text }),
};

function dedupeKeyFor(entityName, record) {
  const build = DEDUPE_KEYS[entityName];
  if (!build || !record) return undefined;
  const key = build(record);
  return Object.values(key).every((v) => v === undefined || v === null) ? undefined : key;
}

// Retry only what a retry can fix: network failures, throttling and server
// errors. A 400/401/403/404 is an answer, not a glitch — retrying it twelve
// times just burns the queue and the user's battery.
function isRetryable(error) {
  const status = error?.response?.status ?? error?.status;
  if (!status) return true; // no HTTP response at all: offline or a dropped connection
  if (status === 429) return true;
  return status >= 500;
}

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(scopedKey(QUEUE_KEY)) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(q) {
  try {
    localStorage.setItem(scopedKey(QUEUE_KEY), JSON.stringify(q));
  } catch {
    // localStorage full or unavailable — nothing we can do
  }
}

function jitter() {
  return Math.floor(Math.random() * 1000); // 0–1s random jitter
}

function getDelay(attempts) {
  const exp = Math.min(BASE_DELAY * Math.pow(2, attempts), MAX_DELAY);
  return exp + jitter();
}

// Adds a failed operation to the queue.
export function queueOperation(op) {
  const queue = getQueue();
  op.attempts = 0;
  op.nextAttemptAt = Date.now() + getDelay(0);
  op.queuedAt = Date.now();
  queue.push(op);
  saveQueue(queue);
  scheduleFlush();
}

// Retries all due operations. Succeeds silently or re-queues with backoff.
export async function flushQueue() {
  const queue = getQueue();
  if (queue.length === 0) return;

  const now = Date.now();
  const remaining = [];

  for (const op of queue) {
    if (op.nextAttemptAt && op.nextAttemptAt > now) {
      remaining.push(op);
      continue;
    }
    try {
      const entity = base44.entities[op.entity];
      if (!entity || typeof entity[op.method] !== 'function') continue;
      // Idempotency for creates: if the record already landed, this is a retry
      // of a write whose response was lost — treat it as done.
      if (op.method === 'create' && op.dedupe) {
        const found = await entity.filter(op.dedupe, { limit: 1 });
        const items = Array.isArray(found) ? found : found?.items ?? [];
        if (items.length > 0) continue;
      }
      await entity[op.method](...op.args);
      // Success — don't re-queue
    } catch (err) {
      // A refusal (403, 404, validation) will never turn into a success —
      // retrying it only delays the queue behind a write that cannot land.
      if (!isRetryable(err)) {
        console.error('[writeQueue] dropping non-retryable write:', op, err?.message || err);
        continue;
      }
      op.attempts = (op.attempts || 0) + 1;
      if (op.attempts >= MAX_RETRIES) {
        console.error('[writeQueue] max retries reached, dropping:', op);
      } else {
        op.nextAttemptAt = Date.now() + getDelay(op.attempts);
        remaining.push(op);
      }
    }
  }

  saveQueue(remaining);
  if (remaining.length > 0) scheduleFlush();
}

export function getQueueLength() {
  return getQueue().length;
}

let flushTimer = null;
export function scheduleFlush() {
  if (flushTimer) return;
  const queue = getQueue();
  if (queue.length === 0) return;
  const nextAt = Math.min(...queue.map((op) => op.nextAttemptAt || 0));
  const delay = Math.max(nextAt - Date.now(), 1000);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushQueue();
  }, Math.min(delay, 60000));
}

// Wraps the base44.entities object so that fire-and-forget writes (update,
// delete, deleteMany, updateMany, bulkUpdate) are automatically queued on
// failure. Read operations and create pass through unchanged.
export function createResilientEntities(rawEntities) {
  return new Proxy(rawEntities, {
    get(target, entityName) {
      const entity = target[entityName];
      if (!entity || typeof entity !== 'object') return entity;
      return new Proxy(entity, {
        get(eTarget, methodName) {
          const orig = eTarget[methodName];
          if (typeof orig !== 'function') return orig;
          if (QUEUEABLE_METHODS.has(methodName)) {
            return (...args) => {
              const promise = orig.apply(eTarget, args);
              if (promise && typeof promise.catch === 'function') {
                promise.catch((error) => {
                  if (methodName === 'create' && !QUEUEABLE_CREATES.has(entityName)) return;
                  if (!isRetryable(error)) return;
                  queueOperation({
                    entity: entityName,
                    method: methodName,
                    args,
                    dedupe: methodName === 'create' ? dedupeKeyFor(entityName, args[0]) : undefined,
                  });
                });
              }
              return promise;
            };
          }
          return orig.bind(eTarget);
        },
      });
    },
  });
}

// Start flushing on app load and when connectivity returns.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(() => flushQueue(), 1000);
  });
  setTimeout(() => flushQueue(), 5000);
}