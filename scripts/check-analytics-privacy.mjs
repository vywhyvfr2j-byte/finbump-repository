// Build-time privacy guard for analytics.
//
// FinBump stores family details, prayer requests and health notes, so analytics
// may never carry free text. The server-side allowlist in
// base44/shared/analyticsPrivacy.ts drops anything undeclared at write time;
// this script is the earlier net: it fails the build when a call site tries to
// send a personal field, or names an event that is not declared.
//
// Run: node scripts/check-analytics-privacy.mjs   (wired into `npm run build`)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['src', 'base44'];
const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);
// The gateway module forwards a caller's metadata on purpose; it holds no
// payload of its own, so it is not scanned.
const SKIP_FILES = new Set(['src/hooks/useFeatureTracking.js']);

const FORBIDDEN = [
  'name', 'fullName', 'preferredName', 'personName', 'notes', 'note', 'noteText',
  'text', 'message', 'messageText', 'email', 'userEmail', 'phone', 'address',
  'zipCode', 'birthday', 'anniversary', 'prayer', 'prayerNames', 'prayerReason',
  'healthNotes', 'details', 'description', 'body', 'title', 'reviewText',
  'keywords', 'reasons',
];
const FORBIDDEN_KEY = new RegExp(`(?<![A-Za-z0-9_])(${FORBIDDEN.join('|')})\\s*:`, 'i');

function walk(dir, out = []) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (EXTS.has(extname(entry))) out.push(full);
  }
  return out;
}

// Returns the argument list of the call whose "(" is at openIndex, braces and
// all, capped so a runaway scan can never hang the build.
function balancedArgs(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length && i - openIndex < 4000; i++) {
    const ch = text[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) return text.slice(openIndex + 1, i);
    }
  }
  return text.slice(openIndex + 1, openIndex + 800);
}

function declaredEvents() {
  const src = readFileSync(join(ROOT, 'base44/shared/analyticsPrivacy.ts'), 'utf8');
  const block = src.slice(src.indexOf('ANALYTICS_EVENTS'));
  return new Set([...block.matchAll(/^\s{2}([a-z0-9_]+):\s*\{/gm)].map((m) => m[1]));
}

const declared = declaredEvents();
const problems = [];
const notes = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = file.slice(ROOT.length + 1).replaceAll('\\', '/');
    if (SKIP_FILES.has(rel)) continue;
    const text = readFileSync(file, 'utf8');
    const lineOf = (index) => text.slice(0, index).split('\n').length;

    const calls = [];
    for (const match of text.matchAll(/\btrackEvent\s*\(/g)) {
      calls.push({ index: match.index, open: match.index + match[0].length - 1 });
    }
    for (const match of text.matchAll(/\banalytics\.track\s*\(/g)) {
      calls.push({ index: match.index, open: match.index + match[0].length - 1 });
    }
    for (const match of text.matchAll(/['"]track-analytics-event['"]/g)) {
      calls.push({ index: match.index, open: match.index });
    }

    for (const call of calls) {
      const args = call.open === call.index
        ? text.slice(call.index, call.index + 700)
        : balancedArgs(text, call.open);
      const line = lineOf(call.index);

      const bad = args.match(FORBIDDEN_KEY);
      if (bad) {
        problems.push(`${rel}:${line} — analytics call sends "${bad[1]}", which the privacy plan forbids.`);
      }

      if (call.open !== call.index) {
        const named = args.match(/^\s*['"]([a-z0-9_]+)['"]/);
        if (named && !declared.has(named[1])) {
          problems.push(`${rel}:${line} — event "${named[1]}" is not declared in base44/shared/analyticsPrivacy.ts.`);
        }
      } else {
        const named = args.match(/eventName\s*:\s*['"]([a-z0-9_]+)['"]/);
        if (named && !declared.has(named[1])) {
          problems.push(`${rel}:${line} — event "${named[1]}" is not declared in base44/shared/analyticsPrivacy.ts.`);
        }
      }

      const dynamicMeta = args.match(/(?:metadata|meta)\s*:\s*[A-Za-z_$]/) || /,\s*[A-Za-z_$][\w$]*\s*\)?\s*$/.test(args);
      if (dynamicMeta) notes.push(`${rel}:${line} — metadata passed as a variable; the server allowlist filters it.`);
    }
  }
}

if (problems.length) {
  console.error('\nAnalytics privacy check failed:\n');
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  console.error('\nOnly declared, non-personal fields may be sent. See base44/shared/analyticsPrivacy.ts.\n');
  process.exit(1);
}

console.log(`Analytics privacy check passed — ${declared.size} declared events, no personal fields sent.`);
for (const note of notes) console.log(`  · ${note}`);