# Premium Feature Video Recording Guide

Step-by-step recording scripts for each **AI-powered** premium feature shown in
onboarding. Follow each script on a phone (or simulator) to capture a clean
screen recording, then drop the file URL into the matching `videoUrl` field in
`src/components/onboarding/featureData.js`.

## General recording tips (apply to every video)

- Record in **portrait (9:16)** at 1080p — these play inside a phone-sized card.
- Keep each clip **15–25 seconds**. Shorter is better; the card loops.
- Turn off notifications / Do Not Disturb before recording so pop-ups don't
  interrupt the capture.
- Sign in to an account that already has **sample people and a few saved
  gifts/notes**, so the screens look lived-in rather than empty.
- Use a real finger or cursor; avoid long hesitations. Smooth, steady taps.
- Hide the bottom navigation bar overlap if your recorder captures it — frame
  the recording to start just below the top nav and end above the bottom bar,
  OR include the bottom bar consistently so it reads as "in-app."
- Start each clip already on the feature's main screen (no login, no loading
  spinner). Trim those out.

---

## 1. AI Gift Finder  (`/ideas`)

**Goal:** Show the AI suggesting personalized gift ideas for a contact.

1. Open the app and tap **Explore → AI Gift Finder** (or navigate to `/ideas`).
2. On the ideas page, select a contact who has likes/preferences filled in
   (e.g. "Jordan — likes hiking, coffee, reading").
3. Tap the **"Suggest gifts"** (or "Find ideas") button.
4. Wait for the AI spinner, then let the list of suggested gift ideas populate.
5. Slowly scroll through 3–4 suggested gifts so each card's name, reason, and
   price band are visible.
6. Tap one gift idea to open its detail (shows the "why" and a buy link).
7. Tap the bookmark/save icon on one idea to show it saving to the tracker.
8. Stop recording.

**Keep visible:** the contact's name, the AI-generated reasoning text, and the
saved-state confirmation.

---

## 2. AI Message Writer  (`/message-writer`)

**Goal:** Show the AI writing a heartfelt message in the user's tone.

1. Navigate to `/message-writer`.
2. Select an occasion (e.g. "Birthday") and a recipient contact.
3. Enter 1–2 short keywords or a tone hint (e.g. "funny, warm").
4. Tap **"Write message"** (or the generate button).
5. Let the AI-generated message appear in the text area.
6. Tap **"Use this"** or copy it into the card preview.
7. Optionally tap "Regenerate" once to show a second variation.
8. Stop recording.

**Keep visible:** the occasion, the keywords input, and the full generated
message text rendering in the preview.

---

## 3. Chat Assistant  (`/chat`)

**Goal:** Show asking the assistant a question and getting an instant answer.

1. Navigate to `/chat`.
2. Tap the message input and type a real question, e.g.
   "How do I add a new anniversary reminder?"
3. Send the message.
4. Wait for the typing indicator, then let the assistant's answer render fully.
5. (Optional) Send one follow-up like "Can it repeat every year?" to show the
   conversation continuing.
6. Stop recording.

**Keep visible:** the user's typed question and the assistant's full reply.

---

## (Optional) Group Meals  (`/meals`)

If you also want a clip for the "Plan together" AI meal feature:

1. Navigate to `/meals` and tap **"New gathering"** (or "Plan a meal").
2. Fill in a title, area, cuisine, budget, and add 2–3 participants.
3. Tap **"Send invites"** (or "Create").
4. Once responses are in, tap **"Suggest a plan"** to show the AI picking a
   restaurant and time.
5. Let the AI plan card (venue, rationale, fit score) render.
6. Stop recording.

---

## (Optional) Vacation Planner  (`/vacation-planner`)

If you also want a clip for the "Plan together" AI trip feature:

1. Navigate to `/vacation-planner` and tap **"New trip"**.
2. Enter a destination, dates, and add travelers.
3. Once travelers respond, tap **"Suggest a plan"** (or the AI plan button).
4. Let the AI itinerary render (day-by-day activities, stays, eats, budget).
5. Scroll slowly through the itinerary so 2–3 days are visible.
6. Stop recording.

---

## After recording

1. Upload each clip — public hosting is fine for onboarding demos.
2. Put the URL into the matching `videoUrl` field in
   `src/components/onboarding/featureData.js` (e.g. the AI Gift Finder item).
3. Re-open onboarding to confirm the video autoplays inside the premium card
   instead of the static poster.