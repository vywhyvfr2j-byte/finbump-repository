# Contact & Calendar Sync — Quick Setup Guide

FinBump lets you import your contacts and special dates in minutes so the app
can start reminding you about the people who matter. Here's how it works and
how to get going fast.

---

## 1. Google Contacts Sync (recommended for quick setup)

The fastest way to populate FinBump is to sync from Google Contacts. One
connection pulls in names, birthdays, anniversaries, emails, and phone
numbers for everyone in your Google account — no manual entry.

### How to set it up
1. Open **People** (the contacts tab).
2. Tap **Sync Google Contacts**.
3. Sign in with your Google account and grant contacts access.
4. FinBump imports your contacts automatically — birthdays and
   anniversaries become reminders instantly.

### What gets synced
| Field | Used for |
|-------|----------|
| Name | Contact display + card greetings |
| Birthday | Birthday countdowns & reminders |
| Anniversary | Anniversary countdowns & reminders |
| Email | Card delivery + FinBump-user detection |
| Phone | Future SMS delivery |

### Smart deduplication
If you already have a contact with the same name, sync **updates** that
contact's missing fields instead of creating a duplicate. So it's safe to
sync even after you've added a few people manually.

### Staying in sync
Tap **Sync again** any time to pull in new contacts or updated info from
Google. You can also **Disconnect** from the same screen to revoke access.

---

## 2. Manual entry (for a few key people)

If you only want to track a handful of close connections:
1. Open **People** → tap **+**.
2. Enter their name, birthday, anniversary, and any notes.
3. Save — they'll appear on your Home countdown and reminders immediately.

---

## 3. Calendar / special dates

Once contacts are synced (or added manually), their birthdays and
anniversaries automatically appear on:
- **Home** — the "Today / Coming up" countdown card surfaces the next occasion.
- **Calendar** — every birthday, anniversary, and custom event in one view.
- **Daily reminders** — push notifications fire on the day of the occasion.

You can also add custom one-time or recurring events (graduations, surgeries,
trips) from the Calendar page — these feed the same countdown and reminder
system.

---

## 4. iOS home-screen widget (native app)

Once your contacts are in FinBump, the iOS widget reads the next upcoming
occasion from the `get-next-countdown` data feed and shows a live countdown
tile on your home screen — no need to open the app to check. Tapping it
deep-links straight to the card builder for that person.

See `docs/ios/FinBumpWidget.swift` for the WidgetKit implementation template.

---

## Quick-start checklist

- [ ] Open **People** → **Sync Google Contacts** → sign in
- [ ] Confirm birthdays appear on **Home** countdown card
- [ ] Open **Calendar** to see all occasions in one view
- [ ] (Optional) Enable push notifications in **Settings** for day-of alerts
- [ ] (Native app) Add the FinBump widget to your home screen

That's it — FinBump takes over from there, reminding you before each occasion
and helping you send a card in two taps.