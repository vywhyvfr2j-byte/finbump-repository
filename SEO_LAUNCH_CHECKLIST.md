# FinBump — SEO checklist: 50 → 100 before going public

**Checked live on 14 Nov 2026.** What the platform reports right now:

| Fact | Value |
|---|---|
| SEO score | **50/100 (grade F)** — 2 failing checks, 10 warnings |
| Scan date | **28 Aug 2026** — older than most of the app |
| Scan detail | **Not stored** — the 2 failures and 10 warnings aren't retrievable, so a fresh scan is needed to name them |
| Custom domain | `finbump.online` — DNS **verified** |
| What `finbump.online/` serves | **"Coming Soon! Your application is being prepared."** |
| Live app URL | `https://finbump-memory.base44.app` (published 11 Nov, **unpublished changes** pending) |
| Pages hidden from search | **None** — every page is indexable |
| `robots.txt` | Present: `Allow: /`, sitemap → `https://finbump-memory.base44.app/sitemap.xml` |
| `sitemap.xml` | Present, but lists **all 69 routes**, including private and token pages |
| Page titles | Auto-generated; 5 still say "| Keepsake"; several broken |
| Page descriptions | ~63 pages share one boilerplate sentence |
| Search Console | Not connected (rankings are estimates) |

Work top to bottom. Sections 1–2 are what actually move the score; 3–6 are what keep the score once you're public.

---

## 1. Unblock the address search engines will index (highest impact)

- [ ] **Make `finbump.online` serve FinBump instead of "Coming Soon!"** — Dashboard → **Domains**. DNS is already verified, so this is the serving/connection step, not a DNS record change. *Verified today: `/` still returns the placeholder.*
- [ ] **Publish the pending changes** — Publish button at the top of the editor. Nothing fixed in code is live until you do.
- [ ] **Decide the one canonical host** and keep every link, share tag and sitemap on it (`finbump.online`). Today `og:url` claims `https://finbump.online/` while `robots.txt` and the sitemap point at the base44.app host — that split is exactly what a canonical check fails on.

## 2. Hide the pages that must never be indexed

Marketing → **SEO & GEO** → **Meta tags** → set **Search visibility Off** for each:

- [ ] **Accounts:** Login, Register, Forgot Password, Reset Password, Mfa, OAuth Consent
- [ ] **Token pages (critical — a URL with a private invite token):** Meal Invite, Trip Invite
- [ ] **Member-only screens:** Settings, My Profile, Analytics, Growth Dashboard, Admin Insights, Paywall, Thank You, Trial Dashboard, Chat, Search, Progress, Progress Hub, Timeline, History, Onboarding, Onboarding Preview, Icon Preview, Future Upgrades, Suggest Improvement, Reviews, Find It Hub, Gift Tracker, Meals, Meal Dashboard, Meal Detail, Vacation Planner, Trip Idea Review, Memory Summary, Remembering, Me
- [ ] **Detail pages** (they render one person's / group's data): Act Detail, Group Detail, Partner Profile, Cards, Card Builder, Occasions, Saved Items
- [ ] **Keep On** (the pages that sell the product): **Welcome, Features, About Us, User Guide, Little Steps Guide, Privacy Policy, Terms**

## 3. Rewrite titles and descriptions

Same page, **Meta tags** tab.

- [ ] **5 titles still say "| Keepsake"** instead of "| FinBump": History, Progress, About Us Page, Timeline, Onboarding Preview.
- [ ] **Fix the broken titles:** "O Auth Consent" → *OAuth Consent*, "Mfa" → *Two-Factor Authentication*, "About Us Page" → *About Us*, "Progress Hub" vs "Progress" (one feature, two names), "Onboarding Preview".
- [ ] **~63 duplicate descriptions** all read *"X on FinBump. A digital memory vault designed to help you capture, organize, and remind you."* Rewrite at least the 7 public pages with distinct copy.
- [ ] **`/features` has no title or description** in the settings, though it's in the sitemap. It's your strongest search page — give it one.
- [ ] Use the words people actually search: **birthday and anniversary reminders, memory journal, caregiving check-ins, keepsake app, relationship reminders**.

## 4. Crawl files, structured data, AI discovery

Marketing → **SEO & GEO** → **Advanced settings**.

- [ ] **Sitemap:** currently 69 URLs including `/login`, `/settings`, `/paywall`, `/analytics`, `/meal-invite`, `/trip-invite`. After step 2, confirm it lists **only the public pages**.
- [ ] **Robots.txt:** confirm it is on, allows crawling, and points at the sitemap of the **canonical domain** (it points at the base44.app host today).
- [ ] **AI assistant discovery (llms.txt):** On.
- [ ] **Structured data / JSON-LD:** check it names **FinBump** and `https://finbump.online` — not the base44.app host or the old Keepsake name.

## 5. Search engines

- [ ] **Connect Google Search Console** (Marketing → SEO & GEO) and verify `finbump.online`.
- [ ] **Submit the sitemap** there.
- [ ] **URL Inspection** on `/welcome` and `/features` — check what Google actually receives. Before JavaScript runs, the HTML is the launch splash inside an empty `<main>`, so those two pages need real heading/paragraph text in the markup to be rankable.

## 6. Share previews

- [ ] After step 1, paste `https://finbump.online` into a share-preview debugger (or Slack/WhatsApp) and confirm title, description and card render.
- [ ] Confirm the share image is a wide **1200×630** card, not a square app icon.

## 7. Re-scan and clear the rest

- [ ] **Run a fresh SEO scan** in Marketing → **SEO & GEO → Overview**. The stored detail for the 28 Aug scan is gone, so this is the only way to see the current 2 failures and 10 warnings individually.
- [ ] Work the fresh checklist in order — any check with an **Apply fix** button clears in one click.
- [ ] Re-run the **security scan** (out of date) so launch isn't blocked by an unknown finding.
- [ ] **Publish**, then re-run the SEO scan once more and confirm the score before announcing.

---

### Order for one sitting

Domains (1) → Publish (1) → hide private pages (2) → public page metadata (3) → sitemap/robots/llms (4) → Search Console (5) → scan (7) → share preview (6).
