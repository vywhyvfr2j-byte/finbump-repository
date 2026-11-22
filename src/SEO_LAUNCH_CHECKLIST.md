# SEO: 50 → 100

Your score (50/100, grade F: 2 failures + 10 warnings) comes from a scan dated **28 Aug 2026**. Base44 stores a score only with its scan, so the score cannot move until you run a new one — and the per-item detail behind the old one has expired, so the 12 open items can only be listed by the scan itself.

**Step 0.** Marketing → **SEO & GEO** → **Overview** → **Run scan** (after the fixes below, so it scores the fixed version). Each item in its result has an **Apply fix** button where a fix is automatic.

**Step 0.5.** **Publish.** The scan reads the published app, and you have unpublished changes.

Everything below is verified from your live site and settings today — these are the things the scan will flag.

---

## 1. Your sitemap publishes 68 URLs, including pages that must never be indexed

`/sitemap.xml` currently lists, among others: `/settings`, `/analytics`, `/growth`, `/admin-insights`, `/paywall`, `/trial`, `/login`, `/register`, `/mfa`, `/reset-password`, `/forgot-password`, `/onboarding`, `/icon-preview`, `/chat`, `/search`, `/me`, `/future-upgrades`, `/suggest-improvement`, `/reviews`, `/oauth/consent`, **`/meal-invite`**, **`/trip-invite`**.

The two invite pages carry a private token in the URL — those must not be in Google at all.

- [ ] **Meta tags** tab → set **Search visibility Off** on every page above, plus every detail page (`/acts`, `/groups/:id`, `/meals/:id`, `/people`, `/pets`).
- [ ] Leave **On** only for: `/` , `/welcome`, `/features`, `/about-us`, `/user-guide`, `/little-steps`, `/privacy`, `/terms`.

## 2. Redirect aliases are listed as separate pages

The sitemap and `llms.txt` both list the same page many times under its old routes: Find It appears at `/events`, `/special-dates`, `/dashboard`, `/schedule-calendar`, `/calendar`; Progress Hub at `/history`, `/timeline`, `/progress`; Relationship Notes at `/milestones`, `/relationship-goals`, `/relationship-notes`; Gift Tracker at `/gift-ideas` and `/gift-tracker`.

- [ ] Hide the nine aliases: `/events`, `/special-dates`, `/dashboard`, `/schedule-calendar`, `/history`, `/timeline`, `/milestones`, `/relationship-goals`, `/gift-ideas`.

## 3. Every page shares one description

All ~70 pages read "X on FinBump. A digital memory vault designed to help you capture, organize, and remind you." That is duplicate meta across the whole site.

- [ ] In **Meta tags**, write a real description for the eight public pages, each different, using what people search: birthday and anniversary reminders, memory journal, caregiving check-ins, keepsake app, relationship reminders.
- [ ] `/features` still has the boilerplate title — give it a real title and description; it is your best search-facing page.
- [ ] Fix the broken titles: **"O Auth Consent"** (→ OAuth Consent), **"Mfa"** (→ Two-Factor Authentication), **"About Us Page"**, **"Onboarding Preview"**, and the duplicate "Progress Hub" / "Progress".
- [ ] Five titles still end in **"| Keepsake"** (History, Progress, Timeline, About Us Page, Onboarding Preview) — the old name.

## 4. Structured data describes your private records, not your product

The Schema.org preview Base44 generates maps internal entities: **Person with `email` and `telephone`**, Prayer Request, Trip, Milestone, Gift Idea. That puts contact details into machine-readable markup instead of describing FinBump.

- [ ] Open the JSON-LD preview in the SEO tabs and turn off markup for the internal entities, so the public pages carry Organization / WebSite / SoftwareApplication instead.

## 5. Two hosts, and the public one is a placeholder

`robots.txt`, `sitemap.xml` and `llms.txt` are all served from **finbump-memory.base44.app**, while every link you send (and `og:url`) says **finbump.online** — which currently answers with a "Coming Soon!" page.

- [ ] Dashboard → **Domains**: make `finbump.online` serve the app.
- [ ] Then re-scan so the crawl files are generated against the one public host.

## 6. Search Console

- [ ] Connect Google Search Console and submit the sitemap. Until it is connected, ranking data in the app is estimated, and index-coverage errors are invisible.

---

### Order to do it in
1. Meta tags: hide private pages + aliases (1, 2) → 2. write the eight public descriptions and fix the five titles (3) → 3. structured data (4) → 4. domain (5) → 5. Publish → 6. Run scan, apply any remaining one-click fixes → 7. Search Console (6).
