// Predefined script of answers for common FinBump questions.
// Each entry has keywords for matching and a ready-made answer so the chat
// can respond instantly without an LLM call. The AI fallback (InvokeLLM) handles
// anything that doesn't match a script entry.

export const CHAT_SCRIPT = [
  {
    id: 'pairing',
    keywords: ['pair', 'partner', 'sync', 'connect', 'code', 'spouse', 'link account'],
    question: 'How do I pair with my partner?',
    answer: `To pair with your partner, go to Settings → Sync tab. Your pairing code is displayed there automatically — tap the copy button to copy it, or tap "Send invite via text" to share it with a personal note. Your partner opens their own Settings → Sync tab, enters your code, and taps Connect. Your accounts connect — acts, events, gift ideas, and trips will sync between you. Pairing is optional, so FinBump works fully on its own without it.`,
  },
  {
    id: 'add-person',
    keywords: ['add person', 'new person', 'add contact', 'add someone', 'add people', 'add a person'],
    question: 'How do I add a new person?',
    answer: `Open Explore → Who You Love and tap the add button. Enter their name, relation, birthday, anniversary, notes, photo, zip code, phone, likes, and any custom details you want to track. You can also link them to other people (spouse, child, parent, sibling) from their profile using the relationships feature.`,
  },
  {
    id: 'remembering',
    keywords: ['remembering', 'remember someone', 'passed away', 'passed on', 'deceased', 'memorial', 'remembrance', 'in memory', 'no longer with us'],
    question: 'How do I remember someone who has passed away?',
    answer: `Open Explore → Who You Love, tap the person (or pet), then tap "Edit profile" and turn on "Remembering them". Choose the date you keep — the day they passed, or the day you last had them in your life — set how many days ahead you would like to be reminded (3 by default), and add a note of what you would like to do that day, like "Light a candle". Their photos, notes and timeline stay exactly where they are, while birthday, anniversary, gift and check-in reminders step aside for that one quiet date each year. The "Remembering" filter at the top of Who You Love lists everyone you are holding in memory, and the date appears in Month Ahead under "Remembering · Dates you keep", with a reminder in your notification feed a few days before and on the day itself.`,
  },
  {
    id: 'act-reminders',
    keywords: ['reminder', 'act reminder', 'set up reminder', 'notification', 'cadence', 'interval', 'recurring'],
    question: 'How do I set up reminders for acts?',
    answer: `When you create or edit an act, set its cadence — Every Day, Week, Month, or "One time" — and make sure "Notify" is on. FinBump will remind you when the act is due based on that cadence. For a "One time" act, pick the date it's for and FinBump schedules it as a single, non-recurring event with "Coming up" reminders at 30 days, 10 days, 3 days, and the day of. You can also toggle which notifications you receive in Settings → Alerts tab, including daily push notifications that summarize due acts and care reminders straight to your phone. Acts show as fresh, due, overdue, or drifting depending on how long since you last completed them.`,
  },
  {
    id: 'cancel-subscription',
    keywords: ['cancel', 'subscription', 'refund', 'trial', 'billing', 'premium cancel'],
    question: 'How do I cancel my subscription?',
    answer: `Go to Settings → Plan tab and tap "Cancel Subscription." This creates a cancellation request for review. During your free trial, there's no refund needed — access simply ends when the trial expires. After the trial, you'll receive a prorated refund for the remaining months, effective at the end of your current billing month. FinBump has two paid tiers: Basic ($9.49/year, or $29.99 one-time for Lifetime Basic) covers core relationship tracking, and Premium ($18.99/year, or $59.99 one-time for Lifetime Premium) adds the AI features, Grab a Meal group planning, and family pass sharing. Annual plans include a 7-day free trial. You can also move to a Lifetime pass (one-time payment, never renews) from the Plan tab.`,
  },
  {
    id: 'what-to-track',
    keywords: ['what can i track', 'what does', 'features', 'what is finbump', 'what can finbump', 'what do you do'],
    question: 'What can I track in FinBump?',
    answer: `FinBump tracks acts of support, events and special dates, milestones, gift ideas and budgets, care and prayer reminders, group gatherings (Grab a Meal), vacation plans, pets, personal notes, relationship notes, and reach-out frequency — all across every person in your life. The Home dashboard and Explore page bring everything together in one view.`,
  },
  {
    id: 'export-data',
    keywords: ['export', 'download data', 'data export', 'backup', 'json'],
    question: 'How do I export my data?',
    answer: `Go to Settings → Account tab → Data Export. This downloads all your local and server-side data as a single JSON file. You'll find the option in the Legal section of the Account tab.`,
  },
  {
    id: 'gift-tracker',
    keywords: ['gift', 'budget', 'tracker', 'present', 'gift idea', 'gift budget'],
    question: 'How does the gift tracker work?',
    answer: `The Gift Tracker (Budget & Tracker) lets you save gift ideas with a title, link, price, category, occasion, and budget. Mark gifts as purchased or gifted as you go. You can track spending against a budget per person or per trip, and AI gift suggestions use the person's likes, notes, and preferences to recommend personalized ideas.`,
  },
  {
    id: 'prayer-reminders',
    keywords: ['prayer', 'pray', 'care reminder', 'health reminder', 'check in', 'faith'],
    question: 'How do I set up prayer reminders?',
    answer: `Open the Care & Prayer page from Explore → Care & Prayer, or go to any person's profile and enable prayer reminders. Set the cadence (in days) and optionally an end date. You can add prayer names and a reason or intention. FinBump will remind you to pray and track when you last prayed. The "Mine" tab on Care & Prayer lets you add your own prayer needs — share them with all synced connections or send directly to a specific person. Requests default to 7 days and cap at 30 days. Toggle "My prayer requests" in Settings → Sync → Friend connections to control whether they're visible to synced friends.`,
  },
  {
    id: 'acts',
    keywords: ['what is an act', 'how do acts work', 'act of support', 'acts of support', 'support act'],
    question: 'What are acts of support?',
    answer: `Acts are recurring or one-time things you do for someone — like "Send a sweet text", "Plan a date night", or "Call mom". Each act has a cadence (Every Day, Week, Month, or "One time"), a category (act, prayer, health, or other), and an assigned person. Pick "One time" and a date for a special, non-recurring act — it shows on your calendar and gets "Coming up" reminders at 30, 10, 3, and 0 days out. Check acts off when done and the next due date updates automatically.`,
  },
  {
    id: 'events',
    keywords: ['event', 'birthday', 'anniversary', 'holiday', 'special date', 'calendar'],
    question: 'How do events and special dates work?',
    answer: `Events are one-time or recurring dates like birthdays, anniversaries, and holidays. Add them from the Explore page, each with optional reminders set for specific days before. Holidays are automatically injected into the calendar. The calendar shows all events, birthdays, holidays, and your acts of support (recurring acts on every scheduled day, one-time acts on their date) in a monthly color-coded grid. For a quick view of every birthday and anniversary coming up, grouped by month, open Month Ahead from Explore.`,
  },
  {
    id: 'vacation',
    keywords: ['vacation', 'trip', 'travel', 'plan trip', 'itinerary', 'flight', 'hotel'],
    question: 'How does the vacation planner work?',
    answer: `The Vacation Planner lets you plan trips with itinerary, flights, hotels, rental cars, packing lists, locations, and budgets. If you're paired with your partner, trips can be shared so you both see them. AI trip ideas are available, and you can link gift ideas to trips for budget tracking.`,
  },
  {
    id: 'pets',
    keywords: ['pet', 'dog', 'cat', 'add pet', 'animal'],
    question: 'How do I add a pet?',
    answer: `Open Explore → Pets and tap the add button. Each pet has a name, owner (a person in your connections), species, breed, birthday, adoption date, notes, photo, and likes. Pets have their own health and prayer reminders, and they're user-managed only — no pairing needed.`,
  },
  {
    id: 'message-writer',
    keywords: ['message', 'write message', 'message writer', 'text message', 'card message'],
    question: 'What does the Message Writer do?',
    answer: `The Message Writer helps you craft messages for your people. AI generates suggestions based on the person and the occasion, and you can choose different lengths and tones. Every message is editable before you finalize it, so you can tweak it to sound like you.`,
  },
  {
    id: 'milestones',
    keywords: ['milestone', 'timeline', 'relationship milestone', 'life event'],
    question: 'What are milestones?',
    answer: `Milestones let you track relationship and life milestones with dates, descriptions, and reminders. They appear on the calendar and in your reminders, so you can celebrate and remember the big moments over time.`,
  },
  {
    id: 'daily-encouragement',
    keywords: ['daily encouragement', 'devotional', 'daily verse', 'what is daily encouragement'],
    question: 'What is daily encouragement?',
    answer: `Daily encouragement sends a short story, encouragement message, and/or daily scripture to your notifications each day — you can toggle each type on or off individually. The scripture is based on your selected faith tradition (Christian, Jewish, Muslim, Hindu, Buddhist, or Other). Toggle it on and pick your tradition in Settings → Your Needs tab or My Profile. You can also steer the verse toward a specific subject or Bible book using the "Scripture topic" field. Choose "Other" to receive a variety of scriptures from various world religions — one per day — and use the "Scripture topic" field to specify your particular tradition or sacred text (e.g. "Bhagavad Gita", "Tao Te Ching", "Guru Granth Sahib").`,
  },
  {
    id: 'bible-verses',
    keywords: ['add bible', 'bible verse', 'bible verses', 'add scripture', 'how do i add bible', 'get bible verses', 'receive bible verses'],
    question: 'How do I add bible verses?',
    answer: `To receive daily Bible verses in FinBump:

1. Open Settings → Your Needs tab (or My Profile).
2. Turn on "Daily encouragement."
3. Under "Faith tradition," select "Christian" (or Jewish, Muslim, Hindu, Buddhist, or Other).
4. Tap "Save settings."

You'll receive a new verse and explanation each day in your notifications. The verse is drawn from your selected tradition's scriptures and comes with a short explanation of its context and how it applies to daily life. Choose "Other" to receive a variety of scriptures from various world religions (one per day), and use the "Scripture topic" field to specify your particular tradition or sacred text.`,
  },
  {
    id: 'bible-subjects',
    keywords: ['bible verse specific', 'bible specifics', 'certain book', 'certain subject', 'bible book', 'scripture topic', 'scripture subject', 'bible subject', 'specific bible', 'specific scripture', 'specific book', 'specific subject'],
    question: 'How do I add bible verse specifics, like certain books or subjects?',
    answer: `To steer the daily verse toward a specific book or subject:

1. Open Settings → Your Needs tab (or My Profile) and make sure Daily encouragement is turned on with a faith tradition selected.
2. Find the "Scripture topic (optional)" field right under the faith tradition selector.
3. Enter a subject (e.g., "money", "love", "relationships", "salvation") or a specific Bible book (e.g., "Psalms", "Proverbs", "John"). If you chose "Other" as your faith tradition, use this field to specify your particular tradition or sacred text (e.g., "Bhagavad Gita", "Tao Te Ching", "Guru Granth Sahib", "indigenous spirituality").
4. Tap "Save settings."

The daily verse will now relate to your chosen topic. Leave the field blank to receive verses from across your tradition's scriptures with no specific focus. For "Other," leaving the field blank gives you a different world religion's scripture each day. Changing the topic regenerates the next day's verse automatically.`,
  },
  {
    id: 'setup-process',
    keywords: ['setup process', 'add myself', 'add partner', 'add other people', 'setup walkthrough', 'walk me through', 'setup guide', 'how do i set up', 'getting started guide', 'add me and partner'],
    question: 'Walk me through the setup process to add myself, partner, and other people.',
    answer: `Here's how to set up yourself, your partner, and other people in FinBump:

Step 1 — Yourself: You can set up your own profile from My Profile (Explore → My Profile) — your name, birthday, preferences, sizes, and love languages. Edit your details anytime from there.

Step 2 — Your partner: During onboarding, you'll add your primary person (partner/spouse by default) with their name, birthday, anniversary, and preferences. Edit their details anytime from the Partner tab. To sync data with a partner who has their own account, go to Settings → Sync tab and generate a pairing code for them to enter on their device.

Step 3 — Other people: Go to Explore → All People and tap the add (+) button. Enter their name, relation, birthday, notes, and any custom details. You can link people to each other (spouse, child, parent, sibling) from their profile using the relationships feature.`,
  },
  {
    id: 'notifications',
    keywords: ['notification', 'bell', 'alert', 'in-app notification', 'notify'],
    question: 'How do notifications work?',
    answer: `FinBump sends in-app notifications for overdue acts, upcoming events, milestones, and daily encouragement. A notification bell in the top bar of each page shows your unread count. Configure which notifications you receive in Settings → Alerts tab, and toggle "Daily push notifications" to receive a daily phone notification summarizing due acts and care reminders. You can also fine-tune per-item notifications for individual acts, events, and people.`,
  },
  {
    id: 'notification-dots',
    keywords: ['notification dot', 'unread dot', 'the dot', 'dot mean', 'dots mean', 'dot next to', 'colored dot', 'coloured dot', 'red dot', 'amber dot', 'blue dot', 'row dim', 'row dims', 'dimmed', 'faded', 'greyed out', 'grayed out', 'crossed out', 'strikethrough', 'legend', 'what does the dot'],
    question: 'What do the notification dots mean?',
    answer: `Each row in your notifications carries a small colored dot while it's still unread — red for the most urgent (an overdue act, or a date right around the corner), amber for medium, and blue for low-priority ones like daily encouragement. Once you tap a row to open it, or check it off with the checkmark button, the dot disappears and the row dims, with its title crossed through, so you can see at a glance what you've already handled. Read and completed items stay in the list until the day rolls over, so nothing vanishes on you mid-day, but they no longer count toward the number on the bell. "Mark all read" at the top clears the dot from every row at once.`,
  },
  {
    id: 'onboarding',
    keywords: ['onboarding', 'get started', 'setup', 'first time', 'new user', 'how do i start'],
    question: 'How do I get started with FinBump?',
    answer: `When you first open FinBump, onboarding asks you to choose a language — English or Español — then whether you're new or already set up. If you're new, it walks you through setting up your primary person (partner/spouse by default) — their name, birthday, anniversary, and three things they love. You can edit your own profile separately from My Profile (Explore → My Profile). After onboarding, the Home dashboard shows your acts of support, event reminders, and quick stats. The bottom navigation has five tabs — Home, Acts, Partner, Calendar, and Explore — and the Explore tab is a grid of every feature, grouped by category. You can also enable Daily encouragement and Daily push notifications from Settings or My Profile anytime.`,
  },
  {
    id: 'delete-account',
    keywords: ['delete account', 'delete my account', 'remove account', 'close account', 'permanently delete'],
    question: 'How do I delete my account?',
    answer: `Go to Settings → Account tab → Account Deletion. This permanently deletes your account and all associated data — it cannot be undone. You'll be asked to confirm before it happens. If you just want a copy of your data first, use Data Export before deleting.`,
  },
  {
    id: 'find-it',
    keywords: ['find it', 'search', 'where is', 'how do i find', 'locate feature'],
    question: 'How do I find a specific feature?',
    answer: `The Explore tab in the bottom navigation shows a grid of every feature in FinBump, grouped by category — People & Pets, Connect & Express, Relaxation & Wellness, Track & Reflect, Premium Items, and Support & Info. Tap any item to jump straight to it, and Premium features are marked with a Premium badge. The Calendar tab holds your dates and the Appreciation view, and Settings and the User Guide both live in Explore.`,
  },
  {
    id: 'family-package',
    keywords: ['family package', 'family pass', 'super family', 'family starter', 'share pass', 'share premium', 'give pass', 'gift pass', 'family plan', 'family subscription'],
    question: 'What are Family Packages and how do I share passes?',
    answer: `Family Packages bundle your own annual Premium with shareable passes for friends and family:

• Family Starter ($29.99/year): You + 1 annual pass to share.
• Family Package ($44.99/year): You + 3 annual passes to share.
• Super Family Pass ($49.99/year): You + 4 annual passes to share.

All three family packages renew at 15% off the current package price — a loyalty discount that applies automatically from year 2 onward.

To share a pass: Go to Settings → Plan tab → "Share your passes." Generate an annual code, optionally add who it's for, and a unique code is created. Copy or share the code via text. The recipient enters it in their FinBump app under Settings → Plan → "Redeem a pass" to unlock Premium for 1 year.`,
  },
  {
    id: 'lifetime-passes',
    keywords: ['lifetime', 'lifetime pass', 'lifetime premium', 'one-time', 'never renews', 'lifetime plan', 'lifetime essential', 'lifetime plus', 'lifetime family'],
    question: 'What are Lifetime passes and how do they work?',
    answer: `Lifetime passes are one-time payments for permanent Premium access — they never renew and never expire. Available from Settings → Plan tab:

• Lifetime Basic ($29.99): permanent Basic for you.
• Lifetime Premium ($59.99): permanent Premium for you.
• Lifetime Plus ($119.99): permanent Premium for you + 2 annual passes to share.
• Lifetime Family/Group Plan ($179.99): permanent Premium for you + 4 annual passes to share (add more people anytime for $10 each).

If you're currently on a monthly subscription, you can upgrade to a lifetime pass within 60 days of your most recent payment and pay only the difference between the lifetime price and what you've already paid. Lifetime passes are a one-time charge — no subscription, no renewal, no cancellation needed.`,
  },
  {
    id: 'redeem-pass',
    keywords: ['redeem pass', 'redeem code', 'pass code', 'enter code', 'use pass', 'free pass', 'received code', 'someone gave me', 'invitation code', 'premium code'],
    question: 'How do I redeem a pass code I received?',
    answer: `To redeem a pass code someone shared with you:

1. Open Settings → Plan tab.
2. Scroll to "Redeem a pass" at the top of the Plan section.
3. Enter the code (e.g. KS-XXXXXX) and tap "Redeem."
4. You'll get Premium access — 1 year for an annual pass.

An annual pass lasts 1 year. Each code is single-use, so once it's redeemed it can't be used again. If the code doesn't work, check with the person who shared it — they can see which passes have been used in their own Plan tab.`,
  },
  {
    id: 'connected-to-add-person',
    keywords: ['connected to add', 'need to be connected', 'add person without', 'add without pairing', 'do i need to pair', 'do i need to connect', 'without partner', 'without syncing', 'connection required', 'pair to add person'],
    question: 'Do you need to be connected through the app to add a person and their information for reminders?',
    answer: `No. FinBump works fully on its own — you don't need to be connected or paired with anyone to add people and their information for reminders. Pairing with a partner is completely optional and only syncs data between two linked accounts. You can add as many people, pets, acts, events, and reminders as you like without ever pairing.`,
  },
  {
    id: 'add-person-free-pass',
    keywords: ['add person free pass', 'add someone with pass', 'invite with pass', 'add person pass code', 'free pass add person', 'add family member pass'],
    question: 'How do I add a person using a free pass?',
    answer: `To add a person and give them a free Premium pass:

1. First, make sure you have a Family Package (Settings → Plan tab). Your remaining passes show as "Annual passes" in the "Share your passes" section.
2. Go to Settings → Plan → "Share your passes" and generate an annual code. Optionally add their name in the "who is this pass for?" field so you can track it.
3. Share the code with them via text or copy it.
4. They download FinBump, create their account, and go to Settings → Plan → "Redeem a pass" to enter the code. They'll get Premium access linked to their own account.
5. You can see which codes you've issued and whether they've been used in the "Issued passes" list. Each code is single-use — once redeemed, it can't be reused.`,
  },
  {
    id: 'history-missing-contacts',
    keywords: ['history', 'history list', 'contact not showing', 'contact missing', 'support items not appearing', 'acts not showing', 'filter by contact', 'history filter', 'why don\'t my contacts', 'why dont my contacts', 'history contact', 'completed acts missing', 'log missing'],
    question: 'Why don\'t my contacts show up in the History list?',
    answer: `The History tab inside Progress & History (Explore → Progress & History) shows completed acts and purchased gifts grouped by month, with a contact dropdown to filter by person. All your contacts appear in the dropdown, but here's the important part: only gifts (and newer acts) are reliably linked to a contact by ID. Older acts were saved with just a name, not a linked contact, so when you filter by a contact their older acts won't appear — only their gifts will.

This doesn't mean their data is missing — the acts still exist and show under "All people." It just means those acts weren't linked to the contact when they were created. To see everything, leave the dropdown on "All people." If you expected a contact's acts to show and they don't, that's why — and it's a known limitation we're working to improve.`,
  },
  {
    id: 'color-themes',
    keywords: ['color', 'color theme', 'theme', 'colors', 'season', 'seasonal', 'holiday', 'christmas', 'hanukkah', 'diwali', 'eid', 'easter', 'kwanzaa', 'ramadan', 'valentine', 'halloween', 'st patrick', 'thanksgiving', 'new year', 'sports', 'team color', 'change color', 'change colors', 'recolor', 'dark mode', 'appearance', 'personalize color'],
    question: 'How do I change the app colors for seasons or holidays?',
    answer: `You can pick a color theme that recolors the entire app — buttons, backgrounds, and every icon — to match your style, season, holiday, religion, or favorite team colors.

1. Open Settings → Account tab.
2. Scroll to the "Color theme" section.
3. Browse themes by category — Personal (FinBump, Ocean, Sunset, Forest, Lavender), Seasons (Spring, Summer, Autumn, Winter), Religious (Christmas, Hanukkah, Diwali, Eid, Easter, Kwanzaa, Ramadan), Holidays (Valentine's, Halloween, St. Patrick's, July 4th, Thanksgiving, New Year's), and Sports (Blue & White, Red & White, Green & White, Purple & Gold, Black & Gold, Silver & Blue).
4. Tap any theme to apply it instantly — it saves automatically and persists across sessions.

Your theme is personal to your account, so if you're paired with a partner each of you can have your own. Switch themes anytime by going back and tapping a different one.`,
  },
  {
    id: 'profile-info-purpose',
    keywords: ['why do i need', 'provide information', 'profile info', 'why profile', 'why provide', 'why fill out', 'why add information', 'why enter', 'what is the point of profile', 'why do i need to provide', 'profile information', 'why share information', 'why do i need to provide information in my profile'],
    question: 'Why do I need to provide information in my profile?',
    answer: `The more information you add to your profile — and the profiles of the people you care about — the better FinBump can personalize its features for you. When you fill in details like likes, preferences, sizes, love languages, and notes, FinBump uses that information to help you in two key ways:

• Gift suggestions: The AI gift finder and gift tracker use the person's likes, notes, and preferences to recommend gifts that truly fit who they are — instead of generic ideas.

• Message writer: The Message Writer uses preferences and relationship context to craft messages that align with your loved one's personality and your relationship with them.

Beyond gifts and messages, profile information also powers better act suggestions, more relevant reminders, and a richer calendar of special dates. In short, the details you provide let FinBump tailor its recommendations and messages to your preferences and needs — so everything you do through the app feels more thoughtful and personal.`,
  },
  {
    id: 'groups-bulk-message',
    keywords: ['group', 'groups', 'bulk message', 'bulk text', 'bulk email', 'message group', 'message everyone', 'group message', 'send to group', 'create group'],
    question: 'How do I create a group and send a bulk message?',
    answer: `Groups let you organize your connections (like "Grandkids" or "Church Friends") and message several of them at once.

1. Open Explore → Groups and tap the add button. Name the group, pick an emoji and a color, then add members from your connections.
2. Open any group to see its members, add or remove people, and jump to a member's profile.
3. Tap "Bulk message (N)" to open the bulk message sheet. Select the members you want to reach, choose Text or Email, edit the message and the shared link, then tap Send. FinBump opens your phone's native text or email app with everything pre-filled — you just confirm and send.

Add a phone number and/or an email to each contact's profile so they're reachable. Members missing a phone (for text) or an email (for email) are skipped automatically, and the sheet tells you who's missing what.`,
  },
  {
    id: 'drift-alerts',
    keywords: ['drift', 'drifting', 'noticed', 'haven\'t come up', 'havent come up', 'longer than usual', 'radar', 'drift alert'],
    question: 'What does it mean when FinBump says something is "drifting"?',
    answer: `On the Home dashboard, the "Noticed" card highlights acts that have gone longer than their usual rhythm without being officially overdue yet — a gentle early nudge rather than a hard deadline. For example, if you usually do something every 7 days but it's been 14, FinBump flags it as drifting so you can reconnect before it slips. Tap the card to go to your Acts list and check it off, or tap the act to log it. Completing it resets the rhythm automatically.`,
  },
  {
    id: 'snooze-reminder',
    keywords: ['snooze', 'pause reminder', 'snooze reminder', 'quiet reminder', 'dismiss reminder', 'remind later', 'snoozed'],
    question: 'Can I snooze a care reminder?',
    answer: `Yes. On the Home dashboard, due prayer and health check-in reminders each have a snooze button that hides that reminder for 24 hours — handy if now isn't a good moment. You can also select several reminders at once and snooze them together. Snoozing doesn't turn the reminder off or change its cadence; it just pauses it for a day, then it reappears. To permanently stop a reminder, set its cadence to "Off" on the person's (or pet's) Care reminders section.`,
  },
  {
    id: 'exercise-reminders',
    keywords: ['exercise', 'workout', 'exercise reminder', 'exercise type', 'daily exercise', 'stay active', 'fitness reminder', 'exercise cadence'],
    question: 'How do I set up exercise reminders for myself?',
    answer: `Exercise reminders live inside the Daily Encouragement block on your profile.

1. Open Explore → My Profile and scroll to the Daily Encouragement section.
2. Under "Exercise," pick from preset types (Walking, Running, Yoga, Strength, and more) or add your own custom type. You can rename or delete any type inline.
3. Set a reminder cadence (every day, every 2 days, every 3 days, or weekly). FinBump creates a recurring health-category act for you, so it shows up on Home and in your Acts list like your other reminders.

You can also write personal exercise notes and encouragement for yourself in the same section.`,
  },
  {
    id: 'unpair',
    keywords: ['unpair', 'disconnect partner', 'remove partner', 'stop syncing', 'break pair', 'unlink partner', 'unpair from partner', 'end pairing'],
    question: 'How do I unpair from my partner, and what happens to our shared data?',
    answer: `To stop syncing with your partner, go to Settings → Sync tab and tap "Unpair." This clears the pairing link on both accounts at the same time.

What stays and what changes: data that already synced to your account (acts, events, gift ideas, trips) stays on your account — unpairing doesn't delete anything you already have. From that point on, new items one of you adds will no longer sync to the other. If you ever want to reconnect, either partner can generate a new pairing code and the other enters it.`,
  },
  {
    id: 'privacy-who-sees-data',
    keywords: ['private', 'privacy', 'who can see', 'see my data', 'my data safe', 'secure', 'data shared', 'who sees', 'is my data', 'confidential'],
    question: 'Who can see my data in FinBump?',
    answer: `Your data is private to your account. Only you can see the people, acts, events, gifts, trips, and notes you create — no other user can browse them. The one exception is pairing: when you pair with a partner, the items you both choose to share (acts, events, gift ideas, and trips) sync between your two accounts so you can stay coordinated — and only between those two accounts. Unpairing stops the sharing. You can also export or permanently delete all your data anytime from Settings → Account tab.`,
  },
  {
    id: 'one-time-acts',
    keywords: ['one time', 'one-time', 'one time act', 'special act', 'single act', 'non recurring', 'non-recurring', 'coming up', 'schedule once', 'one off', 'one-off'],
    question: 'How do one-time acts and the "Coming up" reminders work?',
    answer: `Any act can be a "One time" act — whether you pick a template or create your own. Choose "One time" as the cadence and pick the date it's for (like an anniversary surprise or a one-off gesture). FinBump schedules it as a single, non-recurring item: it appears on your calendar as a blue dot on that date, and a "Coming up" banner on Home reminds you at 30 days, 10 days, 3 days, and the day of the event. One-time acts don't repeat — once the date passes, they're done.`,
  },
  {
    id: 'acts-vs-events',
    keywords: ['act vs event', 'difference between act and event', 'act or event', 'acts and events', 'what is an act vs', 'recurring vs one time', 'act versus event'],
    question: 'What is the difference between acts and events?',
    answer: `Acts are things you DO on a rhythm — recurring (or one-time) actions tied to a person, like "Send a sweet text" every 7 days or "Call mom" every 14 days. They have a cadence, show as fresh/due/overdue/drift, and reset when you complete them.

Events are dates you REMEMBER — birthdays, anniversaries, holidays, and custom occasions. They're tied to a calendar date (with optional reminders before), not a completion rhythm.

In short: acts are about your ongoing effort; events are about marking a moment in time. Both appear together on the Explore calendar.`,
  },
  {
    id: 'gift-templates-budget-chart',
    keywords: ['gift template', 'gift templates', 'quick gift', 'budget chart', 'budget vs spent', 'gift chart', 'spending chart', 'jewelry gift', 'gift card template', 'add gift fast'],
    question: 'How do I quickly add a gift and track my spending over time?',
    answer: `In the Gift Tracker, tap the quick-add templates to drop in a common gift fast — choose from Jewelry, Gift card (it'll ask for the store/type), or Other (your own custom idea). Each one fills in the category for you, and you can add a link, price, and budget right away.

To see where you stand, the spending summary at the top of the Gift Tracker shows total spent and budget left, with a filter by occasion. Below it, per-person and per-occasion budget cards show how much you've spent against what you planned, with alerts as you approach or pass your limit.`,
  },
  {
    id: 'grab-a-meal',
    keywords: ['grab a meal', 'group meal', 'meal planner', 'plan a meal', 'plan dinner', 'host a meal', 'host dinner', 'dinner with friends', 'invite people to dinner', 'organize a dinner', 'gathering', 'potluck', 'plan a gathering', 'meal with friends'],
    question: 'How do I plan a group meal and invite people?',
    answer: `Grab a Meal (Explore → Grab a Meal) plans one meal with a group: you set the details, everyone you invite answers with when they're free and whether they can come.

1. Open Grab a Meal and tap the + button.
2. Name the meal, then add a date, an area or place, the kind of food (tap a suggestion like Italian, or type your own), a per-person budget, your menu items, and a personal note to the group.
3. Add invitees: anyone in your connections with an email is suggested — just tap their name — or type a name and email for someone who isn't a contact yet. One guest is enough, or invite as many as you like.
4. Tap "Create & invite." Each guest gets their own private link by email and doesn't need a FinBump account to answer.
5. Guests tell you whether they can make it (Yes, Maybe, or Can't make it), which days and times suit them, their food and area preferences, budget, dietary needs, and a note. They can switch reminder emails off with one tap.

Guests who haven't answered get a friendly reminder (at most one a day), everyone gets a reminder before the day, and anyone who opted out is never emailed. Save a setup you use often as a template — the menu, place, food type, budget, and message come back pre-filled next time.`,
  },
  {
    id: 'meal-rsvp',
    keywords: ['rsvp', 'who is coming', 'who\'s coming', 'whos coming', 'who accepted', 'who declined', 'accepted my invite', 'declined my invite', 'who can make it', 'invitation status', 'meal dashboard', 'gathering responses', 'dinner invite', 'see who is coming'],
    question: 'How do I see who accepted or declined my meal invites?',
    answer: `Open Explore → Grab a Meal and tap the dashboard button (the small chart icon) at the top. It shows your invitations at two levels:

• Totals: the first card counts your meals in the works, confirmed, waiting on answers, and invites out. Below it, the RSVP card totals every open invitation — Coming, Maybe, Can't come, and No answer yet.
• Per gathering: each gathering is listed with its guests grouped under their answer, so you can see exactly who accepted and who declined. Anyone who switched reminders off is noted next to their name.

Tap a gathering's title to open it, where you can read each guest's full answers (days and times, food, area, budget, dietary needs, and notes) or copy their private link to follow up. Once two or more guests have answered, you can ask the AI to suggest a place, food, and date that fit the group — confirm the plan to lock in the date and notify everyone.`,
  },
  {
    id: 'month-ahead',
    keywords: ['month ahead', 'upcoming birthdays', 'upcoming anniversary', 'upcoming anniversaries', 'all birthdays', 'birthday list', 'coming up birthdays', 'birthdays this month', 'see all birthdays', 'occasion dashboard', 'occasions page'],
    question: 'What is Month Ahead and how do I use it?',
    answer: `Month Ahead (Explore → Month Ahead) is a dashboard of every birthday, anniversary, and pet Gotcha Day coming up, grouped by month — so you can plan the weeks ahead in one place.

The card at the top totals what's happening in the next 30 days. Each row shows who it's for, the occasion, how many days away it is, and the milestone they're reaching (their age, or the years together).

From any row you can tap in to see ready-made card messages for that person, jump into the Card Builder for their occasion, or tap "Send a gift" to open gift help already scoped to them — the AI Gift Finder (ideas with buy links, budgets, and tracking) or their gift ideas page. For a pet's occasion, the gift options open for the pet's owner.

Reminders for birthdays and anniversaries appear on Home 18 days, 7 days, and 3 days before the date, and on the day itself — and that same reminder shows up on the Month Ahead page, each with its own "Send a card" and "Send a gift" buttons.`,
  },
  {
    id: 'language',
    keywords: ['language', 'spanish', 'español', 'espanol', 'idioma', 'change language', 'switch language', 'chocaleta', 'english or spanish'],
    question: 'How do I change the language?',
    answer: `FinBump speaks English and Español. You pick your language on the very first onboarding screen ("Choose your language") and the whole app switches right away — in Spanish the app is called ChocAleta, same app, same memories.

To change it later: open My Profile (Explore → My Profile) and use the English ↔ Español switch at the top, or go to Settings → Account tab → Language. Your choice is saved with your preferences, so it follows you to every device you sign in on.`,
  },
  {
    id: 'rate-app',
    keywords: ['rate the app', 'rate finbump', 'rating', 'star rating', 'leave a review', 'write a review', 'review the app', 'app review'],
    question: 'How do I rate the app?',
    answer: `Scroll to the bottom of My Profile (Explore → My Profile) to the "Rate FinBump" section. Tap the stars to give 1 to 5 stars, add a comment if you like, then tap "Submit review".

Above the stars you'll see the average rating and how many reviews we've received, and your own reviews are listed underneath — if the team replies, you'll see "FinBump's response" under your review.`,
  },
  {
    id: 'appreciation',
    keywords: ['appreciation', 'grateful', 'gratitude', 'appreciation calendar', 'appreciation jot', 'one thing today', 'journal'],
    question: 'What is the appreciation journal and calendar?',
    answer: `"One thing today" on Home is your daily appreciation jot — write one thing you appreciated about your partner and tap Save. It takes a few seconds, and it's the habit that makes the rest of FinBump feel natural. Each jot is saved as an appreciation note and appears on that person's timeline.

To see them all, open the Calendar tab and tap "Appreciation": a month grid of everything you've done for the people you love — completed acts of support, prayers, care check-ins, and your jots. Days with something on them show a count (tap a day to see the details), and upcoming acts, prayers, and care check-ins appear on their future days too. Use the arrows to look back at previous months.`,
},
{
id: 'memory-evening',
keywords: ['memory moment', 'evening', 'check-in', 'check in', 'moment today', 'tonight', 'memory reminder', 'evening nudge', 'turn off the evening', 'remember today', 'daily moment', 'what is memory moments'],
question: 'What is the evening check-in and how do I use it?',
answer: `Memory Moments (Explore → Memory Moments) is the heart of FinBump: one small question each evening — "What's one moment today you'd want to remember?" — and a minute is enough to answer it. FinBump nudges anyone who hasn't answered that day at 6pm Central, then follows up gently at 9pm if the moment is still unwritten; both arrive as phone notifications and in your in-app feed. To silence them, go to Settings → Alerts tab and switch "Evening memory reminder" off.`,
},
{
id: 'memory-write',
keywords: ['write a moment', 'add a memory', 'save a moment', 'memory photos', 'add photos to memory', 'edit a moment', 'delete a moment', 'where do memories', 'memory timeline'],
question: 'How do I write a memory moment?',
answer: `Open Explore → Memory Moments and answer tonight's question in your own words, then save. You can add photos to a moment right in the composer — those photos are kept private — and you can edit or delete a saved moment later. Every moment you keep is listed on Memory Moments, newest first, and when a moment is tied to a person it also appears on that person's timeline.`,
},
{
id: 'year-in-moments',
keywords: ['year in moments', 'year summary', 'last twelve months', 'my year', 'yearly reflection', 'see their year', 'moments of the year'],
question: 'What is Year in Moments?',
answer: `Year in Moments (Explore → Year in Moments) is your last twelve months as one scroll: the moments you saved, and the photos kept with them, grouped month by month, with a total for the year. It's a reflection view rather than a place to add things. Opened from a contact with "See their year," it reads only what's linked to that person, plus their profile photos.`,
},
{
id: 'memory-refresh',
keywords: ['memory refresh', 'refresh reminder', 'revisit', 'remind me of', 'come back to this memory', 'revisit a memory'],
question: 'What are memory refresh reminders?',
answer: `On a contact's timeline you can set a gentle reminder to revisit time spent with them, or thinking about them: choose In 1 week, In 1 month, or In 3 months, or pick your own date. When that date arrives the reminder appears in your notification feed with a nudge about that memory.`,
},
{
id: 'cards-send',
keywords: ['send a card', 'card builder', 'greeting card', 'how do i send a card', 'cards', 'card message', 'write a card'],
question: 'How do I send a card?',
answer: `Open Explore → Cards and tap "Send a card" — or use a "Send a card" button on Home's card reminders or on Month Ahead. In the Card Builder you choose the person and the occasion, then either pick a ready-made message from that occasion's library or write your own; you can also add a keyword or two and let FinBump write a message around them, using what you know about that person. Sent and received cards both live under Explore → Cards, in the Sent and Received tabs.`,
},
{
id: 'cards-user-needed',
keywords: ['does the person need the app', 'recipient not a user', 'not a user', 'card delivery', 'sms card', 'text a card', 'card to someone who', 'real card', 'mail a card'],
question: 'Does the person need the app to receive a card?',
answer: `For a digital card, yes — cards deliver app-to-app to contacts who are also FinBump users (FinBump matches them by the email on their profile), and the recipient opens it in their own app under Cards → Received. The recipient picker shows who's already on FinBump with a small badge. If the person isn't a user yet, FinBump tells you the card wasn't delivered, and you can copy the message and send it any way you like. Occasion sheets also include a link to order a real card to mail.`,
},
{
id: 'card-art-reminders',
keywords: ['card art', 'card background', 'card reminder', 'remind me to send a card', '10 days before', 'card design', 'card illustration'],
question: 'What is card art, and when does FinBump remind me to send a card?',
answer: `AI card art (Premium) generates an illustration for your card and sets it behind the message so it still reads clearly — add keywords to steer the art. FinBump also reminds you to send a card 10 days before each birthday and anniversary (people only, not pets); those reminders show on Home and on Month Ahead, each with its own "Send a card" button.`,
},
{
id: 'photos-people-pets',
keywords: ['add photo', 'add photos', 'photo gallery', 'profile picture', 'pet photo', 'full screen', 'view photos', 'add pictures', 'pictures of'],
question: 'How do I add photos to a person or pet, and view them full screen?',
answer: `On a person's or pet's page, tap the add-photo tile in their gallery to upload one or several pictures, and set the main one as their profile picture. Tap any photo to open it full screen and move between photos. Their pictures also show on their timeline — and for people, in Year in Moments when you view their year. Memory-moment photos are added in the memory composer instead.`,
},
{
id: 'photos-privacy',
keywords: ['photo privacy', 'are my photos private', 'who can see my photos', 'photos stored', 'photo link', 'private storage', 'my pictures safe'],
question: 'Are my photos private?',
answer: `Two kinds, kept differently. Photos added to a memory moment are stored privately and shown only through short-lived links that expire after about an hour, so nobody else can open them. Profile and gallery photos for people and pets are stored as unlisted links on FinBump's media storage: they're never listed, searchable, or shown to other users, but anyone holding the exact link could open one — so treat them like a photo you'd share on a private link.`,
},
{
id: 'progress-history-tabs',
keywords: ['progress & history', 'progress and history', 'three tabs', 'history tab', 'timeline tab', 'progress tab', 'charts premium', 'what is premium in progress', 'difference between history and timeline'],
question: 'What are the three tabs in Progress & History?',
answer: `Explore → Progress & History gathers your record in three tabs. Progress: charts and stats of your acts of support over time — the charts are the Premium part of the section. History: a month-by-month log of what you've completed and bought, with a contact dropdown to filter to one person (older acts were saved with just a name, so a person's filter can look empty even though their acts are there under "All people"). Timeline: everything merged into one newest-first feed — completed acts, milestones, personal notes, appreciation jots, and memory moments — with filters to narrow it down. History and Timeline are free for everyone.`,
},
{
id: 'section-search',
keywords: ['search in progress', 'search inside', 'find in history', 'search box at the top of progress', 'search my history', 'find a completed act'],
question: 'How does search inside Progress & History work?',
answer: `There's a search box at the top of Progress & History that looks across everything the section holds — acts you've checked off, gifts you've given, milestones, and notes. Each match opens up to show its full details, so you can find something without knowing which tab it lives in.`,
},
{
id: 'global-search',
keywords: ['search', 'find something', 'magnifier', 'look for', 'search all', 'where is my', 'how do i find'],
question: 'What does Search cover?',
answer: `Search (the magnifier at the top of Home) looks across your acts, people, pets, events, gift ideas, milestones, personal notes, and trips at once, grouping results by kind with a count for each. Tapping a result opens that part of the app — acts open your Acts list, people open Who You Love, gifts open Budget & Tracker, and so on — and "View all" opens the same place.`,
},
{
id: 'saved-items',
keywords: ['saved items', 'saved list', 'save an item', 'wishlist item', 'reference list', 'buy later', 'saved gifts'],
question: 'What is Saved Items?',
answer: `Saved Items (Explore → Saved Items) is your reference list of specific things you want to buy later: add a title and an optional item link, and it stays on the list until you buy it. Items you save while browsing Ideas and the AI gift finder land here too, and any link opens the store in a new tab.`,
},
{
id: 'home-cards',
keywords: ['home screen', 'what are the cards', 'home cards', 'noticed', 'drift', 'quick capture', 'quick reminder', 'smart suggestions', 'countdown', 'what do i see first', 'more to notice', 'spending summary'],
question: 'What are all the cards on the Home screen?',
answer: `Home opens with Today — today's occasions, acts that are due, and care check-ins, with anything in the next three days behind "More". Then Quick capture (jot something down in a tap, with optional voice input) and the Quick reminder box (add a reminder, or reuse a saved message). Below that: Coming up (one-time acts within 30 days), Send a card (birthdays and anniversaries 10 days out), Noticed (acts drifting past their usual rhythm), and a countdown to your soonest occasion. A collapsible "More to notice" section keeps the rest tidy — long-overdue acts, due care reminders with snooze, upcoming people dates, card and one-time reminders, and Smart suggestions, which offer a next step with snooze and dismiss. Your gift spending summary lives at the top of the Gift Tracker, not on Home.`,
},
{
id: 'import-contacts',
keywords: ['import contacts', 'google contacts', 'outlook contacts', 'vcf', 'import phone', 'import my contacts', 'icloud contacts', 'import from phone'],
question: 'How do I import my phone contacts?',
answer: `Open Explore → Who You Love, where you can import three ways: connect Google Contacts, connect Outlook contacts, or upload a .vcf file exported from your phone or iCloud. Names, birthdays, anniversaries, emails, and phones come in, and nothing you've already entered is overwritten — you'll see how many were added and how many were updated.`,
},
{
id: 'import-calendar',
keywords: ['import calendar', 'ics', 'device calendar', 'import birthdays', 'calendar file', 'import from calendar'],
question: 'How do I import my calendar?',
answer: `Go to Settings → Sync tab → Import from calendar and choose an .ics file exported from your device calendar. FinBump finds the birthdays and anniversaries in it, lets you uncheck any you don't want, and adds the rest with reminders already on.`,
},
{
id: 'friends-vs-pairing',
keywords: ['friend connection', 'friend code', 'invite a friend', 'what does my friend see', 'consent', 'friend vs pair', 'difference between friend and pair', 'connections'],
question: 'What is the difference between a friend connection and pairing?',
answer: `Pairing is the full partnership link: acts, events, gift ideas, and trips sync between the two accounts. Friend connections are lighter and consent-based — you share your friend code, and the other person sees only the fields you allow. You can see exactly what they'll see before you send the invite, and change it any time. Both live in Settings → Sync tab, and both are optional.`,
},
{
id: 'sync-requests-consent',
keywords: ['sync request', 'request sync', 'verified connection', 'verify sync', 'share consent', 'consent to share'],
question: 'How do sync requests and share consent work?',
answer: `In Settings → Sync tab you can request a sync with one of your connections; the request and its status show there, and once you've both agreed you can mark the connection verified. Nothing is shared with anyone until you consent to it, and you can see and change the fields a connection can see whenever you like.`,
},
{
id: 'check-uses-finbump',
keywords: ['does my contact use finbump', 'who uses finbump', 'badge', 'contact has an account', 'check if they use', 'is my friend on finbump', 'try again later'],
question: 'How do I know whether a contact already uses FinBump?',
answer: `FinBump checks by email and shows a small badge next to contacts who have an account — in your People list and in the card recipient picker. Those checks are budgeted (a limited number per hour, and an allowance over the life of your account), so if you check a lot of addresses quickly FinBump may ask you to try again later.`,
},
{
id: 'accessibility-setup',
keywords: ['bigger text', 'text size', 'high contrast', 'reduce motion', 'accessibility', 'larger font', 'read easier', 'make text bigger'],
question: 'How do I make the app easier to read?',
answer: `Go to Settings → Account tab → Accessibility. Text size gives you larger options than the default, High contrast strengthens borders and darkens text, and Reduce motion calms animations and transitions.`,
},
{
id: 'install-offline',
keywords: ['install', 'home screen', 'offline', 'app icon', 'add to home', 'standalone', 'without internet', 'no connection', 'download the app'],
question: 'How do I install FinBump on my phone, and does it work offline?',
answer: `FinBump runs in your phone's browser and can be added to your home screen so it opens full screen like an app: on iPhone use Share → Add to Home Screen; on Android use the browser menu → Install app. It also opens offline from its saved shell, but your data comes from your account, so you need a connection to see and save things — there's no full offline mode yet.`,
},
{
id: 'multiple-devices',
keywords: ['multiple devices', 'another device', 'same data', 'other phone', 'tablet', 'two phones', 'different device'],
question: 'Can I use FinBump on more than one device?',
answer: `Yes — sign in with the same account and everything you've saved is there: people, acts, moments, cards, gifts, and trips. Give it a moment and pull down on Home to refresh if something looks behind. A few display choices (text size, high contrast, reduce motion) are set per device, so set those once on each device you use.`,
},
{
id: 'access-code-screen',
keywords: ['access code', 'invite only', 'sign up', 'signup', 'create an account', 'unlock', 'locked out', 'approval'],
question: 'How do I create an account?',
answer: `Anyone can join — no invite and no waiting for approval. Tap Get started on the welcome page, enter your email and a password (or continue with Google or Apple), then type the 6-digit code we email you. You're in straight away and can start adding the people you care about. Choose Basic or Premium whenever you're ready; annual plans come with a 7-day free trial.`,
},
{
id: 'basic-vs-premium',
keywords: ['basic vs premium', 'difference between basic and premium', 'which plan', 'what is premium', 'tiers', 'what do i get', 'plans'],
question: 'What is the difference between Basic and Premium?',
answer: `Basic ($9.49/year, or $29.99 once for Lifetime Basic) covers core relationship tracking: unlimited people, pets and groups; acts with reminders; the calendar and countdowns; the gift tracker; personal notes and the appreciation journal; prayer and care reminders; standard cards; and Progress & History. Premium ($18.99/year, or $59.99 once for Lifetime Premium) adds the AI features — the AI gift finder, Message Writer, Help & Chat assistant, and AI card art, plus the AI trip and meal plans — along with Grab a Meal and family pass sharing.`,
},
{
id: 'trial-and-refunds',
keywords: ['trial end', 'free trial', 'refund', 'my trial', 'charged after', 'money back', 'trial has ended', 'when does my trial'],
question: 'What happens when my free trial ends, and how do refunds work?',
answer: `Annual plans include a 7-day free trial and nothing is charged during it. When the trial ends FinBump shows your plan options once ("Your free trial has ended") — pick a plan to keep going, or dismiss and decide later. To cancel, use Settings → Plan tab → "Cancel Subscription", which creates a request the team reviews: during the trial access simply ends when the trial does, and after the trial the refund is prorated for the unused months and takes effect at the end of your current billing period.`,
},
{
id: 'statement-and-card',
keywords: ['statement', 'bank statement', 'charge on my card', 'update my card', 'payment method', 'new card', 'card expired', 'update payment', 'unrecognized charge'],
question: 'What shows on my statement, and how do I update my card?',
answer: `Charges are processed by our payment provider, Base44 Payments, and appear on your statement with their descriptor alongside your FinBump plan. If you don't recognize a charge, or you need to switch to a different card, open Settings → Account tab → Contact us and send a note — there's no card screen inside the app yet, so we'll help you change the payment method.`,
},
{
id: 'extra-person-addon',
keywords: ['extra person', 'add another person', 'add more people', 'add more family', 'one more pass', 'ten dollars', 'extra pass'],
question: 'How does the $10 extra person add-on work?',
answer: `On the Lifetime Family/Group plan you can add extra people for $10 each, one-time, with no limit. Each add-on grants one more annual pass to share, and you'll find it with the passes in Settings → Plan tab.`,
},
{
id: 'upgrade-to-lifetime',
keywords: ['upgrade to lifetime', 'switch to lifetime', 'difference between', 'credit my payments', '60 days', 'monthly to lifetime', 'pay the difference'],
question: 'Can I upgrade my subscription to a lifetime pass?',
answer: `Yes. If you're on an annual plan, you can move to a lifetime pass within 60 days of your most recent payment and pay only the difference between the lifetime price and what you've already paid. Open Settings → Plan tab and choose the lifetime option — the one-time price is shown before you confirm, and it never renews.`,
},
{
id: 'ai-daily-limits',
keywords: ['ai limit', 'stops after', 'how many ai', 'too many requests', 'limit reached', 'try again tomorrow', 'ai daily', 'why did the ai stop', 'few questions'],
question: 'Why did the AI stop answering after a few questions today?',
answer: `AI features have a daily allowance so costs stay sustainable. The AI message and card writer allows 2 generations a day on free/Basic and 4 a day on Premium. The other AI features — gift ideas, trip and meal planning, card art, and the assistant — allow up to 20 uses a day on free/Basic and 50 a day on Premium, counted per feature. When you reach a limit FinBump asks you to try again tomorrow, and the allowance resets daily.`,
},
{
id: 'which-ai-needs-premium',
keywords: ['which ai features need premium', 'ai premium', 'what needs premium', 'premium features', 'what is premium only'],
question: 'Which AI features need Premium?',
answer: `The AI features are Premium: the AI gift finder, the Message Writer, the Help & Chat assistant, AI card art, the AI trip itinerary in the vacation planner, and Grab a Meal's AI plan. Everything else works on Basic — reminders, acts, the calendar, memory moments, the gift tracker, cards, and Progress & History.`,
},
{
id: 'trouble-invite-email',
keywords: ['invite not arriving', 'email not received', 'no invitation', 'guest did not get', 'spam', 'invite email', 'didn\'t get the email', 'didnt get the email', 'invitation not received'],
question: 'The invite email didn\'t arrive — what should I check?',
answer: `Start with the spam and junk folders, and double-check the address you entered — an invitation goes to exactly the email on the invite. Guest invitations come from FinBump's email sender and some mail providers delay or filter them, so it's worth asking the guest to look for it. You can also copy the person's private invite link from the gathering (or trip) page and send it to them directly — the link works without a FinBump account. Reminders repeat at most once a day, and anyone who switched reminders off is never emailed again.`,
},
{
id: 'trouble-pair-code',
keywords: ['pair code not working', 'pairing code failing', 'code not valid', 'pairing failed', 'cannot pair', 'invalid code', 'already paired', 'too many attempts'],
question: 'My pairing code isn\'t working.',
answer: `A few things to check. Codes are 6 characters, single-use, and a fresh one is generated for your account each time you open Settings → Sync tab — send the current one. You can't pair with your own code, and if either account is already paired you'll need to unpair first; FinBump will tell you if the other person is already connected to someone else. After several wrong attempts pairing pauses for a while ("Too many attempts. Try again later"), so wait a few minutes and try the latest code.`,
},
{
id: 'trouble-reminder-time',
keywords: ['wrong time', 'reminder time', 'came late', 'notification late', 'time zone', 'reminders not on time', 'when do reminders', 'notifications delayed'],
question: 'Why do my reminders arrive at the wrong time?',
answer: `Act and date reminders are day-based — they appear on the day, not at a clock time. The evening memory check-in goes out at 6pm and again at 9pm Central time, and the daily push summary is sent in the morning. The exact minute it reaches you is up to your phone: make sure notifications are allowed for FinBump, keep it added to your home screen, and check battery-optimization settings, since Android can delay notifications for apps it's trying to save power on.`,
},
{
id: 'trouble-stale-app',
keywords: ['stale', 'out of date', 'old version', 'not updated', 'refresh', 'reload app', 'looks stale', 'not refreshing'],
question: 'The app looks stale or out of date.',
answer: `Pull down on Home to refresh your data, and FinBump also checks for a new version and reloads itself when one is published. If something still looks behind, sign out and back in — that reloads everything from your account.`,
},
{
id: 'trouble-device-sync',
keywords: ['not showing on other device', 'missing on my other phone', 'data not there', 'missing data', 'data not appearing'],
question: 'My data isn\'t showing on my other device.',
answer: `Everything you save belongs to your account, so signing in on another device shows the same people, acts, moments, gifts, and cards — give it a moment and pull down on Home to refresh. Check that you're signed in with the same account, and remember a few display choices (text size, high contrast, reduce motion) stay on the device you set them on.`,
},
{
id: 'trouble-buy-links',
keywords: ['buy link', 'link broken', 'link does not work', 'store link', 'product link', 'affiliate', 'link not opening'],
question: 'A gift or buy link doesn\'t open.',
answer: `Buy links open the store in a new tab, and stores retire pages or mark items out of stock, which leaves a dead link. You can edit that gift's link or paste your own, and the item stays on your list. FinBump's buy links are affiliate links, which support the app at no extra cost to you.`,
},
{
id: 'trouble-gathering-cap',
keywords: ['too many gatherings', 'gathering cap', 'cannot create gathering', 'limit meals', 'creating gatherings', 'try again tomorrow gathering'],
question: 'FinBump said I created a lot of gatherings today.',
answer: `Creating gatherings is capped per account per day, because each gathering emails invitations to your guests — the cap keeps that email volume responsible. If you reach it, FinBump asks you to try again tomorrow.`,
},
{
id: 'about-and-support',
keywords: ['who makes', 'about the app', 'who owns', 'contact support', 'user guide', 'suggest a change', 'support', 'who made finbump', 'get help', 'talk to someone'],
question: 'Who makes FinBump, and how do I get help?',
answer: `FinBump is owned and operated by Ugh No Ugh, LLC — Explore → About Us has the mission and the story behind the dolphins. Explore → User Guide is a full, section-by-section walkthrough of the app, and Explore → Suggest a Change sends an idea straight to the team. For help, open Settings → Account tab → Contact us and write your question.`,
},
{
id: 'admin-screens',
keywords: ['admin screen', 'analytics page', 'ops panel', 'improvement ideas', 'admin only', 'affiliate links admin', 'access codes', 'reviews admin', 'admin tools'],
question: 'What are the admin screens?',
answer: `For admins: Analytics (Explore → Analytics) shows active users today, 7 days, and 30 days, total tracked events, a 14-day activity chart, top features, and a shortcut into review management. Admin Insights holds the bi-weekly improvement ideas with priorities until you mark them read. Reviews lets you read and reply to reviews (your reply shows as FinBump's response) and add the real store reviews you've collected. Settings → Plan tab holds the Ops Control Panel (feature kill switches, status banner, maintenance mode, minimum-version gate — changes reach everyone in about 5 minutes), access codes for invites, and affiliate buy links keyed by occasion that go live instantly.`,
},
];

// Match a user's question to a script entry by keyword overlap.
// Returns the best matching entry, or null if no confident match.
export function findScriptMatch(userQuestion) {
  const q = userQuestion.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of CHAT_SCRIPT) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) {
        // Longer keyword matches score higher
        score += kw.length;
      }
    }
    // Also boost if the user's text is close to the predefined question
    const questionWords = entry.question.toLowerCase().split(/\s+/);
    const questionOverlap = questionWords.filter((w) => w.length > 3 && q.includes(w)).length;
    score += questionOverlap * 2;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Require a minimum confidence to use the scripted answer
  return bestScore >= 5 ? bestMatch : null;
}