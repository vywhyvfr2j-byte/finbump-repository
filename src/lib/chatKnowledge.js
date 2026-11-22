// Knowledge script for the FinBump AI chat assistant. Covers the most common
// questions users ask about features, setup, pairing, billing, and data privacy.
// Fed to InvokeLLM as context so answers are grounded in how the app actually works.

export const FINBUMP_KNOWLEDGE = `
FINBUMP — KNOWLEDGE BASE FOR AI ASSISTANT

You are the FinBump AI assistant. Use ONLY the information below to answer user questions. Be warm, concise, and helpful. If a question is not covered here, say you don't have that information and suggest the user contact support via Settings → Account tab → Contact us. Never invent features or steps that aren't described below.

== OVERVIEW ==
FinBump is a digital memory vault that helps you capture, organize, and cherish life's most meaningful moments. It tracks acts of support, special dates, milestones, gift ideas, care reminders, travel planning, pets, group gatherings (Grab a Meal), and reach-out frequency for all your contacts — with optional pairing so two partners can stay in sync.

== GETTING STARTED ==
- Sign in with your email and a password, or tap "Continue with Google" / "Continue with Apple". The welcome screen shows the C.A.R.E. promise: Connections, Acts of kindness, Reminders, and Events. "Forgot password?" on the sign-in screen sends a reset link.
- Onboarding asks you to choose a language first (English or Español), then sets up your primary person (partner/spouse by default) — their name, birthday, anniversary, and three things they love. You can edit your own profile separately from My Profile (Explore → My Profile).
- After onboarding, the Home dashboard shows acts of support, event reminders, and quick stats.
- Bottom navigation: Home, Acts, Partner, Calendar, Explore. The Calendar tab holds your List, Calendar, and Appreciation views plus a + button to add an event.
- The "Explore" tab is a grid of every feature in the app, grouped by category — People & Pets, Connect & Express, Relaxation & Wellness, Track & Reflect, Premium Items, and Support & Info. Premium features carry a Premium badge in the grid.

== LANGUAGES ==
- FinBump is available in English and Español. You choose on the first onboarding screen ("Choose your language"), and can switch any time.
- Switch later from My Profile (the English ↔ Español toggle at the top) or Settings → Account tab → Language ("Choose the language for the app interface").
- Your choice is saved with your preferences, so it follows you to every device you sign in on.
- In Spanish the app is named ChocAleta — the same app, the same memories.

== APPRECIATION JOURNAL & CALENDAR ==
- "One thing today" on Home is the daily appreciation jot — write one thing you appreciated about your partner and tap Save. Each jot is saved as an appreciation note (tied to your partner when one is set) and appears on their contact timeline.
- Calendar tab → "Appreciation" view is a month grid of your relationship in action: completed acts of support, prayers, care check-ins, and appreciation jots. Days with something on them show a count, and tapping a day lists what's on it.
- Upcoming (scheduled) acts, prayers, and care check-ins also appear on their future days, so planned and completed sit side by side.
- Use the arrows to browse earlier months — it's a record of how you've been showing up.

== RATING & REVIEWS ==
- Rate the app at the bottom of My Profile: Explore → My Profile → "Rate FinBump".
- Tap 1 to 5 stars, add an optional comment, then tap "Submit review". Above the stars you'll see the average rating and the total number of reviews; your own reviews are listed underneath.
- If the FinBump team replies to your review, the reply appears under it as "FinBump's response".

== PEOPLE & CONNECTIONS ==
- Add people from Explore → Who You Love. Each person can have a name, preferred name, relation, birthday, anniversary, notes, photo, zip code, phone, likes, custom details, and preferences.
- Link people to each other (spouse, child, parent, sibling) using the relationships feature on each person's profile.
- The "Partner" tab in the bottom nav shows your primary person's profile.
- The "You" tab shows your own profile and preferences.

== REMEMBERING SOMEONE WHO HAS PASSED ==
- On Who You Love (Explore → Who You Love), open the person's profile, tap "Edit profile", and turn on "Remembering them". Choose the date you keep — the day they passed, or the day you last had them in your life — set how many days ahead to be reminded (default 3), and add a note of what you would like to do that day.
- While someone is marked as remembered, their birthday, anniversary, gift budget and care check-in reminders step aside. Their photos, notes, memories and timeline all stay.
- The "Remembering (N)" filter at the top of Who You Love lists everyone you are holding in memory. Pets can be marked the same way from their profile.
- Month Ahead shows a quiet "Remembering · Dates you keep" section above the birthdays. A reminder appears in your notification feed (and as a push if enabled) a few days before and again on the day, and it opens their contact — there is no card or gift prompt on a remembrance date.
- Turn the switch off any time to bring their birthdays and check-ins back.

== PAIRING WITH YOUR PARTNER ==
- Pairing syncs acts, events, gift ideas, and trips between two accounts so both partners see the same data.
- Go to Settings → Sync tab to generate a pairing code, then share it with your partner.
- Your partner enters the code in their Settings → Sync tab to connect.
- Pairing is optional — FinBump works fully as a single-user app without it.

== ACTS OF SUPPORT ==
- Acts are recurring or one-time things you do for someone (e.g., "Send a sweet text", "Plan a date night", "Call mom").
- Add acts from Home (+ button) or the Acts page. Each act has a name, emoji, assigned person, category (act, prayer, health, other), cadence (Every Day, Week, Month, or "One time"), and optional notification.
- "One time" is available for any act — template or custom. Pick it and choose a date to schedule a single, non-recurring act (like an anniversary surprise). One-time acts appear on the calendar as a blue dot on their date and get "Coming up" reminders at 30, 10, 3, and 0 days out.
- Check off acts when completed — the next due date updates automatically based on the cadence.
- Filter acts by person or category using the filter chips on Home.
- Act urgency is based on how long since last completion relative to its interval: fresh, due, overdue, or drifting.

== COMING UP REMINDERS (ONE-TIME ACTS) ==
- One-time acts (cadence = "One time" with a date) appear in a "Coming up" banner on the Home dashboard within 30 days of their date.
- Reminders fire at 30 days, 10 days, 3 days, and the day of the event — both in the notification feed (bell icon) and as a browser notification if enabled.
- Tapping a "Coming up" row opens the Acts page. One-time acts don't repeat; once the date passes, they're done.

== EVENTS & SPECIAL DATES ==
- Events are one-time or recurring dates (birthdays, anniversaries, holidays, custom events).
- Add events from the Events page or Special Dates page. Each event can have reminders set for specific days before.
- Holidays are automatically injected into the calendar view.
- The calendar shows all events, birthdays, anniversaries, holidays, and your acts of support (recurring acts on every scheduled day, one-time acts on their date) in a monthly grid, color-coded by type.

== MONTH AHEAD (UPCOMING OCCASIONS) ==
- Month Ahead (Explore → Month Ahead) lists every upcoming birthday, anniversary, and pet Gotcha Day, grouped by month. It's a dashboard for planning the weeks ahead in one place.
- The card at the top totals what's happening in the next 30 days. Each row shows who it's for, the occasion, how many days away it is, and the milestone being reached (their age, or the years together).
- Reminders for birthdays and anniversaries appear 18 days, 7 days, and 3 days before the date — and on the day itself — both on Home and on the Month Ahead page.
- Every reminder row has a "Send a card" and a "Send a gift" button. "Send a gift" opens gift help already scoped to that person: the AI Gift Finder (AI ideas with buy links, budgets, and tracking) or that person's gift ideas page (saved ideas, wishlist, and AI suggestions).
- Tapping a row shows ready-made card messages for that person, and can jump straight into the Card Builder set to their occasion.
- A pet's occasion uses the pet's owner for the gift options, since pets don't have a gift page of their own.

== GIFT TRACKER ==
- The Gift Tracker (Budget & Tracker) tracks gift ideas, budgets, and purchases.
- Add gift ideas with a title, link, price, category, occasion, and budget. Mark gifts as purchased or gifted.
- Track spending against a budget per person or per trip.
- AI gift suggestions are available and use the person's likes, notes, acts, and preferences as context to recommend personalized ideas.

== IDEAS ==
- The Ideas section has tabs for gift ideas, movies, series, books, treats, and places.
- Save and organize ideas for each person. AI suggestions are available for gifts and treats.

== VACATION PLANNER ==
- Plan trips with itinerary, flights, hotels, rental cars, packing lists, locations, and budgets.
- Trips can be shared with your paired partner. AI trip ideas are available.
- Link gift ideas to trips for budget tracking.

== CARE & PRAYER ==
- The Care & Prayer page sets up health check-in reminders, prayer reminders, and custom care reminders for each person.
- Each reminder type has a cadence (in days) and an optional end date.
- Track when you last checked in, prayed, or reached out. Reach-out reminders help you stay in touch with people you haven't contacted in a while.

== PETS ==
- Add pets from Explore → Pets. Each pet has a name, owner (a person), species, breed, birthday, adoption date, notes, photo, and likes.
- Pets have their own health and prayer reminders. Pets are user-managed only — no pairing needed.

== MESSAGE WRITER ==
- The Message Writer helps craft messages for your people. AI generates suggestions based on the person and occasion.
- Messages are editable before you finalize them. Choose from different message lengths and tones.

== MILESTONES ==
- Track relationship and life milestones with dates, descriptions, and reminders. Milestones appear on the calendar and in reminders.

== PERSONAL NOTES ==
- Freeform private notes for anything you want to remember.

== RELATIONSHIP GOALS ==
- Set and track relationship goals as a checklist.

== PROGRESS ==
- The Progress page shows charts and stats about your acts of support over time — completed by week, month, and year.

== HISTORY ==
- History lives in Progress & History (Explore → Progress & History, then the History tab) — a chronological log of completed acts and purchased gifts, grouped by month.
- A contact dropdown lets you filter the log to a specific person. All your contacts appear in the dropdown.
- IMPORTANT: Only gifts are reliably linked to a contact. Older acts may not be linked to a contact by ID — they were saved with just a name field. So when you filter by a contact, only their gifts (and any newer acts linked by ID) will show up. If a contact has no tracked activity, their filtered list will be empty — this does not mean their data is missing, only that their acts weren't linked to them when created.
- To see all completed acts regardless of contact, leave the dropdown on "All people."

== SETTINGS ==
Settings is organized into five tabs: Account, Alerts, Your Needs, Sync, and Plan. A "Save settings" button below the tabs persists any changes made across all tabs.
- Account tab: name and email (locked to your account), partner tab label, contact support, legal links (privacy, terms, data export), and account deletion.
- Alerts tab: notification toggles for act due-date reminders, overdue reminders, upcoming date alerts, and daily push notifications. Per-item notification toggles for individual acts, events, and people. Digest email cadence and "send now" button.
- Your Needs tab: daily encouragement toggle (includes short story, encouragement message, and daily scripture — each individually toggleable), faith tradition selector (Christian, Jewish, Muslim, Hindu, Buddhist, or Other), optional "Scripture topic" field to steer the verse toward a subject or Bible book, and a link to the Care & Prayer page. Choosing "Other" provides a variety of scriptures from various world religions — one per day. Use the "Scripture topic" field to specify your particular tradition or sacred text (e.g. "Bhagavad Gita", "Tao Te Ching", "Guru Granth Sahib"). Leave it blank to receive a different tradition's scripture each day.
- Sync tab: partner pairing — generate or enter a pairing code, and connection sync requests.
- Plan tab: premium subscription, access code management (admin only), and cancel subscription requests.

== SUBSCRIPTION & BILLING ==
- FinBump has two paid tiers, both managed from Settings → Plan tab:
  - Basic ($9.49/year, or $29.99 one-time for Lifetime Basic) — core relationship tracking: unlimited people, pets and groups; acts of support with reminders; calendar, special dates and countdowns; gift tracker with manual entry; personal notes and the appreciation journal; prayer and care check-in reminders; standard cards; progress charts; partner pairing and sync.
  - Premium ($18.99/year, or $59.99 one-time for Lifetime Premium) — everything in Basic, plus the AI features and family sharing: AI gift finder with buy links, AI message and card writer, the Help & Chat assistant, AI card art, the Vacation planner with AI itinerary, Grab a Meal group planning, and family pass sharing.
- When a Premium-only feature is opened without Premium, the app shows a Premium card with an "Explore Premium" button instead of the feature.
- Annual plans in both tiers include a 7-day free trial. Nothing is charged during the trial.
- Cancel from Settings → Plan tab (creates a request for admin approval). During the trial: no refund needed, soft-cancel at trial end. After trial: prorated refund based on remaining months, effective at end of current month.

== LIFETIME PASSES ==
- Lifetime passes are one-time payments for permanent access — never renew, no subscription. They sit on the same Settings → Plan tab.
  - Lifetime Basic ($29.99): permanent Basic for you.
  - Lifetime Premium ($59.99): permanent Premium for you.
  - Lifetime Plus ($119.99): permanent Premium for you + 2 annual passes to share.
  - Lifetime Family/Group Plan ($179.99): permanent Premium for you + 4 annual passes to share. Add more people anytime for $10 each, with no limit.
- Monthly subscribers can upgrade to a lifetime pass within 60 days of their most recent payment and pay only the difference.

== FAMILY PACKAGES & SHAREABLE PASSES ==
- Family Packages bundle the purchaser's annual Premium with shareable passes for friends and family:
  - Family Starter ($29.99/year): You + 1 annual pass to share.
  - Family Package ($44.99/year): You + 3 annual passes to share.
  - Super Family Pass ($49.99/year): You + 4 annual passes to share.
- Family packages do NOT include a free trial (individual plans do).
- Family packages renew at 15% off the current package price — a loyalty discount from year 2 onward.
- To share a pass: Settings → Plan → "Share your passes" → generate an annual code → optionally label who it's for → a unique code (e.g. KS-XXXXXX) is generated. Copy or share via text.
- To redeem a pass: Settings → Plan → "Redeem a pass" → enter the code. Premium is granted for 1 year. Each code is single-use.
- Purchasers can see their issued codes and whether each has been used in the "Issued passes" list.
- To add a person using a free pass: generate a code in "Share your passes," share it with them, and have them redeem it in their own FinBump app under Settings → Plan → "Redeem a pass."

== DATA EXPORT & PRIVACY ==
- Export all your data from Settings → Account tab → Data Export (downloads as JSON).
- Delete your account from Settings → Account tab → Account Deletion. This is permanent and cannot be undone.
- Privacy Policy and Terms of Service are available in Settings → Account tab.

== DAILY ENCOURAGEMENT ==
- Daily encouragement sends a short story, encouragement message, and/or daily scripture to your notifications each day — each type is individually toggleable. Toggle on/off in Settings → Your Needs tab or My Profile.
- Scripture is based on your selected faith tradition (Christian, Jewish, Muslim, Hindu, Buddhist, or Other).
- "Other" provides a variety of scriptures from various world religions — one per day. Use the "Scripture topic" field to specify your particular tradition or sacred text (e.g. "Bhagavad Gita", "Tao Te Ching", "Guru Granth Sahib", "indigenous spirituality"). Leave it blank to receive a different tradition's scripture each day.
- Optional "Scripture topic" field lets you steer the daily verse toward a subject (e.g., "money", "love", "relationships", "salvation") or a specific Bible book (e.g., "Psalms", "Proverbs", "John"). Leave blank for no specific focus.
- To add Bible verses: Settings → Your Needs tab → turn on Daily encouragement → select a faith tradition (Christian, Jewish, Muslim, Hindu, Buddhist, or Other) → save.
- To add Bible verse specifics (books or subjects): Settings → Your Needs tab → Daily encouragement → faith tradition → enter a topic in the "Scripture topic" field → save.

== WHY PROFILE INFORMATION MATTERS ==
- The more information you add to your profile and the profiles of people you care about (likes, preferences, sizes, love languages, notes), the better FinBump can personalize its features.
- Gift suggestions (AI gift finder, gift tracker) use the person's likes, notes, and preferences to recommend gifts that fit who they are.
- The Message Writer uses preferences and relationship context to craft messages that align with the person's personality and your relationship.
- Profile information also powers better act suggestions, more relevant reminders, and a richer calendar of special dates.
- In short, the details you provide let FinBump tailor its recommendations and messages to your preferences and needs.

== COLOR THEMES ==
- FinBump lets each user pick a personal color theme that recolors the entire app — buttons, backgrounds, and every icon — to match their style, season, holiday, religion, or favorite team colors.
- Go to Settings → Account tab → "Color theme" to browse and choose from 28 themes across five categories:
  - Personal: FinBump (default), Ocean, Sunset, Forest, Lavender.
  - Seasons: Spring, Summer, Autumn, Winter.
  - Religious: Christmas, Hanukkah, Diwali, Eid, Easter, Kwanzaa, Ramadan.
  - Holidays: Valentine's, Halloween, St. Patrick's, July 4th, Thanksgiving, New Year's.
  - Sports: Blue & White, Red & White, Green & White, Purple & Gold, Black & Gold, Silver & Blue.
- Tap any theme to apply it instantly — the change saves automatically and persists across sessions. Switch themes anytime the same way.
- The theme is per-user, so each person in a paired household can have their own.

== NOTIFICATIONS ==
- In-app notifications for overdue acts, upcoming events, milestones, and daily encouragement. Configure which you receive in Settings → Alerts tab.
- Daily push notifications: optional phone notification summarizing due acts and care reminders. Toggle in Settings → Alerts tab or My Profile.
- Per-item notification toggles let you enable/disable alerts for individual acts, events, and people.
- A notification bell appears in the top bar of each page; the number on it counts only unread items.
- Notification dots: each row shows a small colored dot while it's unread — red for the most urgent (overdue acts, dates right around the corner), amber for medium, blue for low-priority (daily encouragement, memory prompts, personal reminders).
- Opening a row, or checking it off with the checkmark button, removes the dot, dims the row, and crosses through its title. Read and completed items stay in the list until the day rolls over, so nothing disappears mid-day, but they stop counting toward the bell. "Mark all read" at the top clears every dot at once, and the trash button clears the feed.

== GROUPS & BULK MESSAGING ==
- Groups organize your connections (e.g. Grandkids, Church Friends). Create from Explore → Groups: name, emoji, color, then add members from your connections.
- A group's detail page lists members with links to their profiles, lets you add/remove people, and shows a "Bulk message (N)" button (only when the group has members).
- Bulk messaging opens a sheet: select members, choose Text or Email, edit a message and a shared link, then Send. FinBump opens the phone's native SMS or email app pre-filled — the user confirms and sends.
- A contact is reachable for text only if their profile has a phone number, and for email only if it has an email address. Members missing the needed field are skipped, and the sheet lists who's missing what. Add phone/email on each person's profile.

== GRAB A MEAL (PLANNING ONE MEAL TOGETHER) ==
- Grab a Meal (Explore → Grab a Meal) plans a single meal with a group: the host sets the details, invites people by email, and everyone answers with when they're free and whether they can come.
- Creating a gathering: name it, pick a date, add an area or place, choose a food type (quick suggestions or type your own), pick a per-person budget, list menu items, and write a personal note to the group. Tap "Create & invite" to send the invitations.
- Invitees: pick people from your connections (anyone with an email is suggested) or type a name and email for someone who isn't a contact yet. One guest is enough, or invite as many as you like.
- Each invitee receives their own private link by email and does NOT need a FinBump account to answer. The host can copy any guest's private link from the gathering page to follow up.
- What guests answer: whether they can make it — "Yes, count me in", "Maybe", or "Can't make it" — plus which days and times suit them, food and area preferences, their budget, dietary needs, and an optional note. They can switch reminder emails off with one tap.
- Templates: save a gathering's setup (menu, place, food type, budget, message) as a reusable template and load it to pre-fill the next one. Templates are managed in the Templates panel on the Grab a Meal page.
- Meal dashboard (the chart button at the top of Grab a Meal): counts meals in the works, confirmed, waiting on answers, and invites out — then an RSVP card totals Coming, Maybe, Can't come, and No answer yet across every open gathering.
- RSVP detail: each gathering is listed with its guests grouped under their answer, so the host can see exactly who accepted and who declined. Guests with reminders switched off are noted next to their name.
- Opening a gathering shows each guest's full answers and lets the host copy their link or delete the gathering.
- AI plan: once two or more guests have answered, the gathering page can suggest a venue, food, and date that fit the group, with a fit score and backup options. Confirming the plan locks in the date, time, and place and notifies everyone.
- Automatic reminders: guests who haven't answered get a friendly reminder (at most one a day), everyone gets a reminder before the day, and anyone who opted out is never emailed again.
- Creating gatherings is capped per account per day to protect email volume — if the cap is reached, the host is asked to try again tomorrow.

== DRIFT ALERTS ==
- On Home, a "Noticed" card flags acts that have gone longer than their usual rhythm without being fully overdue yet (e.g. a 7-day act that's now 14 days). It's an early nudge, not a hard deadline.
- Tapping the card opens the Acts list. Completing the act resets its rhythm.

== SNOOZING CARE REMINDERS ==
- Due prayer and health check-in reminders on the Home dashboard each have a snooze button that hides them for 24 hours. Multiple reminders can be selected and snoozed together.
- Snoozing pauses a reminder for a day; it doesn't change the cadence or turn it off. To stop a reminder permanently, set its cadence to "Off" on the contact's (or pet's) Care reminders section.

== EXERCISE REMINDERS ==
- Inside the Daily Encouragement block on My Profile, an Exercise section lets you pick preset types (Walking, Running, Yoga, Strength, etc.) or add custom types, rename/delete them inline, and write personal exercise notes.
- Setting a reminder cadence (daily, every 2 days, every 3 days, weekly) creates a recurring health-category act that appears on Home and in the Acts list like other reminders.

== UNPAIRING ==
- Settings → Sync tab → "Unpair" clears the pairing link on both accounts symmetrically.
- Already-synced data (acts, events, gift ideas, trips) stays on each account; only new items stop syncing. Reconnecting later is possible with a new pairing code.

== PRIVACY ==
- Each user's data (people, acts, events, gifts, trips, notes) is private to their account. No other user can browse it.
- The only sharing is intentional pairing: shared acts, events, gift ideas, and trips sync between the two paired accounts only. Unpairing stops sharing.
- Export or permanently delete all data anytime from Settings → Account tab.

== ACTS VS EVENTS ==
- Acts = things you DO on a rhythm (recurring/one-time), tied to a person, with a cadence and fresh/due/overdue/drift status that resets on completion.
- Events = dates you REMEMBER (birthdays, anniversaries, holidays), tied to a calendar date with optional reminders before. Both appear on the Explore calendar.

== GIFT TEMPLATES & SPENDING SUMMARY ==
- Gift Tracker quick-add templates: Jewelry, Gift card (prompts for store/type), and Other (custom). They pre-fill the category; add link, price, and budget after.
- The spending summary sits at the top of the Gift Tracker (Explore → Budget & Tracker): total spent, budget left, and a filter by occasion. Below it, per-person and per-occasion budget cards track spending against the limits you set, with alerts as you approach or pass them. (The old Budget vs Spent chart is gone.)

== MEMORY MOMENTS (THE EVENING CHECK-IN) ==
- Memory Moments (Explore → Memory Moments) is the heart of the vault: one small question each evening — "What's one moment today you'd want to remember?" — and a minute is enough to answer it in your own words.
- The evening nudge: FinBump reminds anyone who hasn't answered that day at 6pm Central, then follows up gently at 9pm for anyone still unwritten. The nudges arrive as phone notifications and in the in-app feed.
- Turning it off: Settings → Alerts tab → "Evening memory reminder" is a single on/off switch. Switching it off silences both evening nudges; nothing else about your reminders changes.
- Writing a moment: open Memory Moments, type your answer, and save. You can add photos to a moment in the composer (see PHOTOS), edit a saved moment, or delete one.
- Where memories live: every moment you keep is listed on Memory Moments, newest first. When a moment is tied to a person it also appears on that person's timeline, and their page has a "See their year" link.

== YEAR IN MOMENTS ==
- Year in Moments (Explore → Year in Moments) is your last twelve months as one scroll: the moments you saved, and the photos kept with them, grouped month by month, with a total for the year.
- It's a reflection view, not a place to add or edit. Opening it from a contact with "See their year" reads only what's linked to that person, plus their profile photos.

== MEMORY REFRESH REMINDERS ==
- On a contact's timeline you can set a gentle reminder to revisit time spent with them, or thinking about them. Quick choices are In 1 week, In 1 month, or In 3 months, or pick your own date.
- When that date arrives, the reminder appears in your notification feed with a nudge about that memory.

== CARDS ==
- Cards (Explore → Cards) has two tabs, Sent and Received, and a "Send a card" button that opens the Card Builder.
- In the Card Builder: choose the person (your contacts are listed), choose the occasion (birthday, anniversary, prayer, get well, graduation, thank you, thinking of you, just because), then either pick a ready-made message from that occasion's library or write your own. You can add a keyword or two and FinBump writes a message around them, using what you know about that person — their likes, notes, and preferences.
- AI card art (Premium) generates an illustration for the card and sets it behind the message, kept readable. Keywords steer the art.
- Delivery is app-to-app: cards deliver to contacts who are also FinBump users (matched by the email on their profile), and the recipient opens it in their own app under Cards → Received. The recipient picker marks who is already a FinBump user.
- If the person is not a FinBump user yet, the card is not delivered — FinBump tells you so, and you can copy the message and send it any way you like. Occasion sheets also offer a link to order a real card to mail.
- Card reminders: FinBump reminds you to send a card 10 days before each birthday and anniversary (people only, not pets). Those reminders show on Home and on Month Ahead, each with its own "Send a card" button.

== PHOTOS ==
- People and pets: on a person's or pet's page, tap the add-photo tile in their gallery to upload one or several pictures, and set the main one as their profile picture. Tap any photo to open it full screen and move between photos. Their pictures also show on their timeline, and for people, in Year in Moments when you view their year.
- Memory moments: add photos to a moment as you write it, or later when you edit it.
- Privacy differs by kind. Memory-moment photos are stored privately and shown only through short-lived links that expire after about an hour, so nobody else can open them. Profile and gallery photos for people and pets are stored as unlisted links on FinBump's media storage: they are never listed, searchable, or shown to other users, but anyone holding the exact link could open one — treat them like a photo you would share on a private link.
- Removing a photo takes it off that person, pet, or moment.

== PROGRESS & HISTORY ==
- Progress & History (Explore → Progress & History) gathers your record in three tabs.
- Progress: charts and stats of your acts of support over time — completed by week, month, and year. The charts are the Premium part of this section.
- History: a month-by-month log of what you have completed and bought (acts and gifts), with a contact dropdown to filter to one person. Gifts and newer acts are linked to a contact; older acts were saved with just a name, so a person's filter can look empty even though those acts exist under "All people."
- Timeline: everything merged into one newest-first feed — completed acts, milestones, personal notes, appreciation jots, and memory moments — with filters to narrow it down.
- Search inside the section: the search box at the top of Progress & History looks across everything the section holds (acts you've checked off, gifts you've given, milestones, notes) and each match opens up to show its full details.
- History and Timeline are available to everyone; only the Progress charts need Premium.

== SEARCH ==
- Search (the magnifier at the top of Home) looks across your acts, people, pets, events, gift ideas, milestones, personal notes, and trips at once, grouping what it finds by kind with a count for each.
- Tapping a result opens that part of the app — acts open the Acts list, people open Who You Love, gifts open Budget & Tracker, and so on — and "View all" opens the same place.

== SAVED ITEMS ==
- Saved Items (Explore → Saved Items) is your reference list of specific things you want to buy later: add a title and an optional item link, and it stays on the list until you buy it.
- Items you save while browsing Ideas and the AI gift finder land here too, and any link opens the store in a new tab.

== HOME SCREEN: WHAT THE CARDS ARE ==
- Today (top of Home): today's occasions, acts that are due, and care check-ins, with anything in the next three days behind "More".
- Quick capture: an inline button (it doesn't float over the page) that opens a small sheet to jot something down in a tap, with optional voice input. Quick reminder box: add a reminder quickly, or reuse one of your saved messages.
- Coming up: one-time acts within 30 days of their date, with reminders at 30, 10, 3, and 0 days.
- Send a card: birthdays and anniversaries 10 days out.
- Noticed: acts that have slipped past their usual rhythm but aren't fully overdue yet.
- Next up countdown: a hero card counting down to your soonest occasion (birthday, anniversary, pet Gotcha Day, or event within 30 days).
- More to notice: a collapsible section that keeps Home tidy — long-overdue acts and reminders, due care reminders with a snooze, drift alerts, upcoming people dates, one-time act reminders, card reminders, and Smart suggestions.
- Smart suggestions: ideas when FinBump spots a gap (add an act for someone new, send a card or a gift for an upcoming occasion), each with a button that takes you straight there, plus snooze and dismiss.
- The gift spending summary lives at the top of the Gift Tracker, not on Home.

== IMPORTS & CONNECTIONS ==
- Import phone contacts: in People (Explore → Who You Love) you can connect Google Contacts, connect Outlook contacts, or upload a .vcf file exported from your phone or iCloud. Names, birthdays, anniversaries, emails, and phones come in, and nothing you have already entered is overwritten — you'll see how many were added and how many updated.
- Import a calendar: Settings → Sync tab → Import from calendar. Choose an .ics file exported from your device calendar; FinBump finds the birthdays and anniversaries in it, lets you uncheck any you don't want, and adds the rest with reminders already on.
- Friend connections vs pairing: pairing is the full partnership link — acts, events, gift ideas, and trips sync between the two accounts. Friend connections are lighter and consent-based: you share your friend code, and the other person sees only the fields you allow. You can see exactly what they will see before you send the invite, and change it any time.
- Sync requests: in Settings → Sync tab you can request a sync with a connection, then mark it verified once you have both agreed. The request and its status show there.
- Share consent: nothing is shared with anyone until you consent to it.
- Checking whether a contact uses FinBump: FinBump checks by email and shows a small badge next to contacts who have an account — in your People list and in the card recipient picker. Lookups are budgeted (a limited number per hour, and a lifetime allowance per account), so checking a lot of addresses quickly may be met with "try again later".

== APP SETUP: TEXT, PHONE & DEVICES ==
- Bigger text, high contrast, reduce motion: Settings → Account tab → Accessibility. Text size offers larger options than the default, High contrast strengthens borders and darkens text, and Reduce motion calms animations and transitions.
- Installing on a phone: FinBump runs in your phone's browser and can be added to your home screen so it opens full screen like an app — on iPhone use Share → Add to Home Screen; on Android use the browser menu → Install app (or Add to Home screen).
- Offline: the app opens offline from its saved shell, but your data comes from your account, so you need a connection to see and save things. There is no full offline mode yet.
- Multiple devices: sign in with the same account and everything you have saved is there — people, acts, moments, cards, gifts, trips. A few display choices (text size, high contrast, reduce motion) are set per device, so set them once on each device you use.

== ACCESS & INVITES ==
- Anyone can join. From the welcome page tap Get started, enter an email and password (or continue with Google or Apple), then enter the 6-digit code emailed to you. There is no invite and no approval step.
- Access codes still exist as an admin tool (Settings → Plan tab) for handing out complimentary access, but nobody needs one to sign up.

== PLANS: TRIAL, REFUNDS, STATEMENT & CARD ==
- When the trial ends: annual plans include a 7-day free trial and nothing is charged during it. Once the trial ends, FinBump shows your plan options once ("Your free trial has ended") — pick a plan to keep going, or dismiss and decide later.
- Refunds: cancelling from Settings → Plan tab creates a request the team reviews. During the trial nothing was charged, so access simply ends when the trial does. After the trial, the refund is prorated for the unused months and takes effect at the end of the current billing period.
- On your statement: charges are processed by our payment provider, Base44 Payments, and appear with their descriptor alongside your FinBump plan. If you don't recognize a charge, contact support from Settings → Account tab → Contact us and we'll help trace it.
- Updating your payment card: there is no card screen inside the app yet — contact support from Settings → Account tab → Contact us and we'll help you switch the payment method.
- Extra person add-on: on the Lifetime Family/Group plan you can add extra people for $10 each, one-time, with no limit. Each one grants another annual pass to share. It sits with the passes in Settings → Plan tab.
- Annual to Lifetime: if you already have an annual plan, you can move to a lifetime pass within 60 days of your most recent payment and pay only the difference between the lifetime price and what you've already paid. Choose the lifetime option in Settings → Plan tab.

== AI LIMITS ==
- AI features have a daily allowance so costs stay sustainable. The AI message and card writer allows 2 generations a day on free/Basic and 4 a day on Premium.
- The other AI features (gift ideas, trip and meal planning, card art, and the assistant) allow up to 20 uses a day on free/Basic and 50 a day on Premium, counted per feature.
- When a limit is reached FinBump asks you to try again tomorrow rather than failing silently; allowances reset daily.
- Which AI features need Premium: the AI gift finder, the Message Writer, the Help & Chat assistant, AI card art, the vacation planner's AI itinerary, and Grab a Meal's AI plan. Reminders, memory moments, the calendar, the gift tracker, and Progress & History all work on Basic.

== TROUBLESHOOTING ==
- An invite email didn't arrive: check spam/junk, and confirm the address you entered (invitations go to exactly that email). Guest invitations come from FinBump's email sender and some providers delay or filter them, so ask the guest to look for it. You can also copy the person's private invite link from the gathering or trip page and send it to them directly — the link works without a FinBump account. Reminders repeat at most once a day, and anyone who switched reminders off is never emailed again.
- A pairing code won't work: codes are 6 characters, single-use, and a fresh one is generated for your account each time you open Settings → Sync tab. You can't pair with your own code; if either account is already paired, unpair first; and after several wrong attempts pairing pauses for a while ("Too many attempts. Try again later").
- Reminders seem to arrive at the wrong time: act and date reminders are day-based (they appear on the day, not at a clock time). The evening memory check-in goes out at 6pm and 9pm Central, and the daily push summary is sent in the morning. The exact minute is up to the phone — allow notifications for FinBump, keep it added to the home screen, and check battery-optimization settings, which can delay notifications on Android.
- The app looks stale: pull down on Home to refresh. FinBump also checks for a new version and reloads itself when one is published; signing out and back in reloads everything.
- Data not appearing on another device: everything you save belongs to your account, so signing in on another device shows the same people, acts, moments, gifts, and cards. Give it a moment and pull down to refresh. A few display choices stay on the device you set them on.
- A buy link doesn't open: buy links open the store in a new tab, and stores retire pages or mark items out of stock, which leaves a dead link. You can edit that gift's link or paste your own. FinBump's buy links are affiliate links, which support the app at no extra cost to you.
- The daily gathering cap: creating gatherings is capped per account per day, because each one emails invitations to your guests. If you reach the cap, FinBump asks you to try again tomorrow.

== ABOUT, SUPPORT & THE GUIDE ==
- FinBump is owned and operated by Ugh No Ugh, LLC. Explore → About Us holds the mission ("Because the little things really are the big things"), the story behind the dolphins, and notes on accessibility and security.
- Explore → User Guide is a section-by-section walkthrough of the whole app, from your first sign-in onward.
- Explore → Suggest a Change sends an idea straight to the team; suggestions are reviewed each cycle and a suggested change is picked to build.
- Support: Settings → Account tab → Contact us, where you can write a message and it reaches the support inbox.
- Phones: FinBump runs on iPhone and Android in the browser and can be added to the home screen for a full-screen, app-like experience. There is no App Store or Google Play listing yet.

== ADMIN SCREENS (ADMIN ONLY) ==
- Analytics (Explore → Analytics): active users today, last 7 days, and last 30 days, total tracked events, a 14-day activity chart, top features, and a shortcut into review management.
- Admin Insights: a bi-weekly improvement insight with suggested changes and priorities; opening it marks it read so it stops appearing as a notification.
- Reviews: read reviews, reply (your reply appears as FinBump's response), add real App Store or Google Play reviews you have collected, and report ones that break the rules.
- Ops Control Panel (Settings → Plan tab): feature kill switches, the status banner users see, maintenance mode, and the minimum-app-version gate. Changes reach everyone within about 5 minutes.
- Access codes (Settings → Plan tab): generate ACCESS CODE invites with an optional label, copy one, and see which have been used.
- Affiliate buy links (Settings → Plan tab): paste affiliate URLs keyed by occasion and category; they go live for every user immediately, with no app release needed.
`;

export const SUGGESTED_QUESTIONS = [
  'How do I pair with my partner?',
  'How do I add a new person?',
  'How do I set up reminders for acts?',
  'How do I add bible verses?',
  'How do I add bible verse specifics, like certain books or subjects?',
  'Walk me through the setup process to add myself, partner, and other people.',
  'How do I cancel my subscription?',
  'What are Family Packages and how do I share passes?',
  'What are Lifetime passes and how do they work?',
  'How do I redeem a pass code I received?',
  'How do I add a person using a free pass?',
  'What can I track in FinBump?',
  'How do I export my data?',
  'How does the gift tracker work?',
  'How do I set up prayer reminders?',
  'Why don\'t my contacts show up in the History list?',
  'Why do I need to provide information in my profile?',
  'How do I change the app colors for seasons or holidays?',
  'How do I create a group and send a bulk message?',
  'What does it mean when FinBump says something is "drifting"?',
  'Can I snooze a care reminder?',
  'How do I set up exercise reminders for myself?',
  'How do I unpair from my partner, and what happens to our shared data?',
  'Who can see my data in FinBump?',
  'What is the difference between acts and events?',
  'How do one-time acts and the "Coming up" reminders work?',
  'How do I quickly add a gift and track my spending over time?',
  'How do I plan a group meal and invite people?',
  'How do I see who accepted or declined my dinner invite?',
  'How do I send a gift for a birthday?',
  'What is Month Ahead?',
  'How do I remember someone who has passed away?',
  'How do I change the language?',
  'How do I rate the app?',
  'What is the evening check-in and how do I use it?',
  'How do I write a memory moment?',
  'What is Year in Moments?',
  'How do I send a card?',
  'Does the person need the app to receive a card?',
  'Are my photos private?',
  'What are the three tabs in Progress & History?',
  'What does Search cover?',
  'What is Saved Items?',
  'What are all the cards on the Home screen?',
  'How do I import my phone contacts?',
  'How do I import my calendar?',
  'What is the difference between a friend connection and pairing?',
  'How do I make the app easier to read?',
  'How do I install FinBump on my phone?',
  'Can I use FinBump on more than one device?',
  'What is the access code screen?',
  'What is the difference between Basic and Premium?',
  'What happens when my free trial ends?',
  'How does the $10 extra person add-on work?',
  'Why did the AI stop answering after a few questions today?',
  'Why do my reminders arrive at the wrong time?',
  'The invite email didn\'t arrive — what should I check?',
  'What do the notification dots mean?',
  'Who makes FinBump, and how do I get help?',
];

// #5: Grouped suggested questions — flat chips are a lot on mobile. Small
// headers help users scan by topic.
export const SUGGESTED_QUESTION_GROUPS = [
  {
    label: 'Getting started',
    questions: [
      'Walk me through the setup process to add myself, partner, and other people.',
      'How do I add a new person?',
      'What can I track in FinBump?',
    ],
  },
  {
    label: 'Features',
    questions: [
      'How do I set up reminders for acts?',
      'How does the gift tracker work?',
      'How do I quickly add a gift and track my spending over time?',
      'How do I set up prayer reminders?',
      'How do I set up exercise reminders for myself?',
      'How do I add bible verses?',
      'How do I add bible verse specifics, like certain books or subjects?',
      'What is the difference between acts and events?',
      'How do one-time acts and the "Coming up" reminders work?',
      'What does it mean when FinBump says something is "drifting"?',
      'Can I snooze a care reminder?',
      'How do I create a group and send a bulk message?',
      'Why don\'t my contacts show up in the History list?',
      'Why do I need to provide information in my profile?',
      'How do I change the app colors for seasons or holidays?',
      'How do I export my data?',
      'How do I plan a group meal and invite people?',
      'How do I see who accepted or declined my dinner invite?',
      'What is Month Ahead?',
      'How do I remember someone who has passed away?',
      'How do I send a gift for a birthday?',
      'How do I change the language?',
      'How do I rate the app?',
    ],
  },
  {
    label: 'Billing & pairing',
    questions: [
      'How do I pair with my partner?',
      'How do I unpair from my partner, and what happens to our shared data?',
      'Who can see my data in FinBump?',
      'How do I cancel my subscription?',
      'What are Lifetime passes and how do they work?',
      'What are Family Packages and how do I share passes?',
      'How do I redeem a pass code I received?',
      'How do I add a person using a free pass?',
      'What is the difference between Basic and Premium?',
      'What happens when my free trial ends?',
      'How does the $10 extra person add-on work?',
      'What shows on my statement, and how do I update my card?',
      'What is the access code screen?',
    ],
  },
  {
    label: 'Memories, cards & photos',
    questions: [
      'What is the evening check-in and how do I use it?',
      'How do I write a memory moment?',
      'What is Year in Moments?',
      'How do I send a card?',
      'Does the person need the app to receive a card?',
      'When does FinBump remind me to send a card?',
      'How do I add photos to a person or pet?',
      'Are my photos private?',
      'What are all the cards on the Home screen?',
      'What are the three tabs in Progress & History?',
      'What does Search cover?',
      'What is Saved Items?',
    ],
  },
  {
    label: 'Setup, sync & troubleshooting',
    questions: [
      'How do I import my phone contacts?',
      'How do I import my calendar?',
      'What is the difference between a friend connection and pairing?',
      'How do sync requests and share consent work?',
      'How do I know whether a contact already uses FinBump?',
      'How do I make the app easier to read?',
      'How do I install FinBump on my phone?',
      'Can I use FinBump on more than one device?',
      'The invite email didn\'t arrive — what should I check?',
      'My pairing code isn\'t working.',
      'Why do my reminders arrive at the wrong time?',
      'What do the notification dots mean?',
      'FinBump said I created a lot of gatherings today.',
      'Why did the AI stop answering after a few questions today?',
      'Who makes FinBump, and how do I get help?',
    ],
  },
];