# Help & Chat — Question Coverage Plan

Goal: Ask FinBump should be able to answer **every** question a user can ask about the app.

## How the assistant answers today

| Layer | File | What it does |
| --- | --- | --- |
| Instant script | `src/lib/chatScript.js` | ~46 keyword-matched Q&As answered with no AI call (free, instant). |
| Knowledge base | `src/lib/chatKnowledge.js` | Text fed to the AI for everything the script doesn't match. |
| Suggested chips | `src/lib/chatKnowledge.js` | `SUGGESTED_QUESTION_GROUPS` — the grouped starter questions on the empty chat screen. |

Two rules keep this trustworthy:
1. **Anything in the knowledge base is treated by the AI as fact.** A stale price or a moved menu is worse than "I don't know" — it sends users to a screen that doesn't exist.
2. **Anything asked often belongs in the script**, not the AI — it answers instantly and costs no AI credit.

---

## Part 1 — Answers that are now WRONG and must be corrected

These are already in the knowledge base / script but no longer match the app. Fix before adding anything new.

| Where | Says now | Reality |
| --- | --- | --- |
| Billing (knowledge + `cancel-subscription` script) | "Annual $19.99/year, Quarterly $6.99/quarter, Monthly $2.99/month" | The catalog is now **two tiers**: Basic ($2.99/quarter, $9.49/year, $29.99 lifetime) and Premium ($5.99/quarter, $18.99/year, $59.99 lifetime). Source: `base44/shared/familyPackages.ts`. |
| Billing (all answers) | No mention of Basic vs Premium | Basic and Premium are different products with different features. Lifetime Basic ($29.99) and Lifetime Premium ($59.99) are also missing entirely, as is the $10 Extra Person add-on. |
| Navigation (many answers) | "More → Who You Love", "More → Care & Prayer", "More → My Profile", "Explore → All People" | There is no "More" menu. Everything is in **Explore**, grouped — and the People page is "People". |
| Navigation | "Explore → History" (`history-missing-contacts`) | History is now a tab inside **Progress & History**. The same merge means Timeline is there too. |
| Bible/scripture (`bible-verses`, `bible-subjects`) | "Settings → Daily tab" | The tab is called **Your Needs**. |
| Explore group list (knowledge + `find-it`) | Six groups listed | There are now **seven** — the Premium Items group was added. |
| Themes | "28 themes across five categories" | Confirm the current count and category list still match the picker. |
| `findScriptMatch` keyword collisions | `gift-tracker` matches the bare keyword `gift` | Any gift question (gift for a birthday, gift budgets, gift links) can be hijacked by the gift-tracker answer. Longest-match should win, or the bare keyword should go. |

---

## Part 2 — Questions with NO answer today (the list to add)

Format: question → what the answer needs. Items marked **[you]** need information only the owner has.

### A. Memory Moments & Year in Moments — biggest gap, no coverage at all
1. What is the evening memory check-in and when does it happen? → 6pm question, 9pm follow-up if unwritten; toggle in the memory reminder setting.
2. How do I write a memory moment? → Home evening prompt, memory composer, one per day.
3. Can I add photos to a memory? → memory photo picker + private storage, shown through signed links.
4. Where do my memories go? → Memory Moments list, contact timelines, the appreciation view.
5. What is "Year in Moments"? → Memory Summary: month-by-month reflection of the year with photos.
6. What is a memory refresh reminder? → resurfacing a past moment (act, event, milestone, gift, trip, note) later.
7. How do I turn the evening reminder off? → the memory reminder toggle and where it lives.

### B. Cards
8. How do I send a card? → Card Builder: occasion, message, template, send.
9. Does the person need the app to receive a card? → in-app delivery only; a non-user contact cannot receive one.
10. Can I write my own message or use a ready-made one? → message library, AI suggestions, length/tone options, keywords.
11. Can I add artwork to a card? → AI card art (Premium), template art.
12. Where do sent cards live? → Cards page + "read" status.
13. What are the "Send a card" reminders? → birthdays/anniversaries surfacing card suggestions on Home and Month Ahead.

### C. Photos & galleries
14. How do I add photos to a person or pet? → profile photo + gallery; where uploads are stored.
15. How do I view a gallery full screen? → lightbox.
16. Are my photos private? → private storage + signed links, deleted with the record.

### D. Progress & History (merged section)
17. What is Progress & History? → one section, tabs: Progress, History, Timeline.
18. What's the difference between the tabs? → charts vs completion log vs chronological feed.
19. How do I search inside it? → the hub's own search.
20. Is Progress Premium? → which parts are gated and which are free.

### E. Search & Saved Items
21. How do I search the app? → Search page: what it covers (acts, people, pets, events, gifts, milestones…) and that tapping a result opens the record.
22. What are Saved Items? → where saved ideas/items are kept and how to add/remove.

### F. Home dashboard pieces
23. What is on my Home screen? → Today list, Coming up, Noticed/drift, care reminders, stale-act alert, quick reminder box, gift spending summary, next-up countdown, appreciation jot.
24. What does the "stale act" alert mean and how do I clear it?
25. What are smart suggestions on Home?

### G. People, pets, connections & imports
26. How do I import my phone contacts? → Google Contacts, Outlook, vCard file; what gets imported.
27. How do I import my calendar (holidays/events)? → ICS import.
28. What are friend connections vs pairing? → two different connections; what each shares.
29. How do I approve or decline a connection/sync request?
30. What does the share-consent prompt mean? → what a connection can see, and the "only you can see this" promise.
31. Can I find out whether a contact already uses FinBump? → account check, and that it is budget-limited (per hour and per account) so it cannot be used to sweep a list.

### H. Notifications & reminders (detail)
32. Where do I see all my notifications? → the bell feed and what appears in it.
33. What is the evening reminder setting?
34. What are digest emails, how often do they go, and how do I send one now?
35. What is the Sunday/weekly nudge?
36. How do I turn off alerts for one person, act or event only? → per-item toggles.
37. Notifications aren't arriving — what do I check? → device permission, daily push toggle, quiet hours, PWA installed vs browser.

### I. Themes, accessibility & personalization
38. How do I make the text bigger? → text size options.
39. What is high contrast / reduce motion?
40. Do seasonal and holiday animations change anything else?
41. Can two people on one account have different themes? (paired accounts each keep their own.)

### J. Account, access & getting in
42. Why do I see an access code screen? → invite gate, how access is approved. **[you: the intended path — who approves, how long it takes]**
43. How do I sign in, reset my password, or sign out?
44. Can I change my name or email? → what is locked to the account and what to do instead.
45. Can I use FinBump on more than one device? → same account, data follows you.
46. Install as an app on my phone / does it work offline?
47. Why did a paywall appear? → trial ended / pass lapsed, and how to dismiss or subscribe.

### K. Billing, plans & passes
48. What do Basic and Premium each include? → the gated feature list. **[you: confirm the split]**
49. What do current prices and plans cost? → read from `familyPackages.ts`, not typed by hand.
50. What happens when my free trial ends? → paywall, access state.
51. What happens when I cancel, and do I get a refund? **[you: refund policy wording]**
52. Who processes the payment and what shows on my statement? **[you]**
53. How do I update my payment method? **[you]**
54. What is the Extra Person add-on ($10)?
55. Can I upgrade from monthly to lifetime, and what do I pay? → 60-day window, difference only.

### L. AI features & limits
56. What can the AI features do? → gift finder, message writer, trip ideas, meal plan, card messages/art, treat advisor.
57. Why did AI stop answering today? → 2/day on free and Basic, 4/day on Premium; resets daily. **[you: confirm]**
58. Which AI features need Premium?

### M. Privacy, data & deletion
59. What is the privacy shield / why did the app lock?
60. What happens to my data if I unpair, downgrade, or stop paying?
61. What is kept after I delete my account? **[you: retention wording]**
62. Can I move my data to another account?

### N. Troubleshooting (every one of these is a support-ticket class)
63. Invite emails from Grab a Meal or Take a Trip never arrived.
64. A pairing code doesn't work.
65. My history shows nothing for a contact. (exists — but re-point the navigation)
66. A reminder fired at the wrong time / time zone. **[you: which time zone reminders use]**
67. The app looks out of date or won't refresh.
68. Data added on one device isn't showing on another.
69. A gift buy link doesn't open. → links leave the app; some retailers block embedded browsers.
70. The AI said it doesn't have the information.
71. I can't create another gathering today. → daily cap for email volume.

### O. About the app itself
72. Who makes FinBump, and what is the C.A.R.E. promise?
73. What is the in-app User Guide and what does it cover?
74. How do I suggest a change or report a bug? → Suggest a Change, and the monthly winner draw.
75. How do I contact support, and how quickly do you reply? **[you: address + expectation]**
76. Is FinBump available on iPhone and Android, and are there store links? **[you]**
77. What languages are supported? (extend the existing answer if more are added)

### P. Admin-only (the owner's account sees these)
78. What does the Analytics page show?
79. What are Admin Insights / the bi-weekly improvement ideas?
80. How do I manage reviews and reply to them?
81. What are Future Upgrades?
82. What does the Ops panel do — feature flags, status banner, maintenance mode, rollout percentage?
83. Access codes, cancellation requests, suggestions and affiliate links — where are they managed?

---

## Part 3 — Data only you can provide

Every item here is a place the assistant must say something correct, and the app has no record of the answer:

1. Refund policy wording (trial, after trial, partial months).
2. Who processes payments, and what appears on the card statement.
3. How a user updates their payment method.
4. Support contact address and realistic reply time.
5. Sender address that meal/trip invites come from (so users can whitelist it).
6. Which time zone reminders, digests and the 6pm/9pm memory nudge use.
7. Which holidays the calendar injects, and for which region.
8. Whether buy links earn a commission, and the exact disclosure wording.
9. Basic vs Premium feature split (confirm against the gates in the app).
10. The daily AI message limit and whether it will change.
11. Account-deletion retention wording.
12. App store links and minimum device/OS support.

---

## Part 4 — How to keep it answering everything

1. Correct Part 1 first — a wrong price or a dead menu path is a bug.
2. Add the top ~25 questions from Part 2 to `chatScript.js` so they answer instantly; the rest go into the knowledge base.
3. Refresh the suggested chips so the empty chat screen surfaces the new headline features (memories, cards, Year in Moments).
4. Keep billing answers generated from `familyPackages.ts` values, so a plan change never leaves a stale price in the chat.
5. Add a rule to the assistant's instructions: if a question falls outside the knowledge base, offer the support hand-off instead of guessing — and never invent a menu path.