// Sharding for the scheduled fan-out jobs.
//
// Every scheduled job here runs as ONE backend function call that touches every
// user. Once the base grows past a few thousand accounts, a single invocation
// runs past the function timeout and fails for everyone at once — with no error
// anyone sees, because nothing is left to report it. The workflow instead runs
// the function N times in sequence, each with its own slice.
//
// The slice is applied to the USER list before any per-user work, so an
// invocation never builds reminders or renders emails for users it will not
// send to. A job that pages its users (send-daily-push-notifications) shards by
// page instead — see USER_PAGE there — so each run touches only its own pages
// and the base is never loaded whole.
//
// Workflow usage: { "shard": 0, "totalShards": 4 }, { "shard": 1, ... }, …
// Omit both to process everything in one run (local testing, dry runs).

export function resolveShard(body: any, defaultTotalShards = 1): {
  shard: number;
  totalShards: number;
} {
  const rawTotal = Number(body?.totalShards);
  const totalShards =
    Number.isInteger(rawTotal) && rawTotal > 0 ? rawTotal : defaultTotalShards;
  const rawShard = Number(body?.shard);
  const shard = Number.isInteger(rawShard) ? rawShard : 0;
  // Clamp: an out-of-range shard would otherwise silently process nobody.
  return { shard: Math.min(Math.max(shard, 0), totalShards - 1), totalShards };
}

// The slice this invocation owns. Index-based so the N invocations partition the
// list exactly — every user lands in one, and only one, shard.
export function shardSlice<T>(items: T[], shard: number, totalShards: number): T[] {
  if (totalShards <= 1) return items;
  return items.filter((_, i) => i % totalShards === shard);
}