export const GUIDE_INTRO = `This guide walks you through your initial setup and a full walkthrough of every feature. FinBump is like a reminder app for your heart. It helps you remember to do nice things for the people you love. FinBump's slogan is "Because the little things really are the big things." Every call, every card, every prayer — it all adds up to showing people they're loved.`;

export const GUIDE_LESSONS = [
  {
    title: 'Open the App',
    icon: 'Smartphone',
    steps: [
      {
        heading: 'Create your account',
        bullets: [
          'Tap the FinBump icon on your phone',
          'The welcome screen greets you with our C.A.R.E. promise — Connections, Acts of kindness, Reminders, and Events',
          'If you don\'t have an account yet, tap "Create Account"',
          'Type your email address and make up a password you\'ll remember',
          'In a hurry? Tap "Continue with Google" or "Continue with Apple" instead — no password needed',
          'Check your email for a confirmation link and tap it',
          'Forgot your password? Tap "Forgot password?" on the sign-in screen for a reset link',
        ],
      },
      {
        heading: 'The Welcome Tour',
        bullets: [
          'The first question is "Choose your language" — pick English or Español',
          'The whole app switches language right away (in Spanish it\'s called ChocAleta)',
          'The app will ask a few questions to set you up',
          'It asks for your partner\'s name — type what you call them',
          'It asks for their birthday and your anniversary (if you have one)',
          'It asks for three things they love (this helps with gift ideas later)',
          'It offers to pull in your Google contacts so your people are already there',
          'It suggests a few starter acts of kindness — pick the ones you like',
          'Don\'t worry — you can change all of this later!',
        ],
      },
      {
        heading: 'You\'re Home!',
        bullets: [
          'After the welcome, you\'ll see your Home screen',
          'This is like the front page of a newspaper — it shows what\'s most important today',
          'At the bottom of the screen, you\'ll see five buttons: Home, Acts, Partner, Calendar, and Explore',
          'Tap Home to see your daily reminders and what\'s coming up',
          'Tap Explore to find everything else — your people, pets, gifts, prayer, settings, and more',
        ],
      },
    ],
  },
  {
    title: 'The Home Screen',
    icon: 'Home',
    steps: [
      {
        heading: 'What You See First',
        bullets: [
          'At the very top, you\'ll see the FinBump logo and buttons for Chat, notifications, and your progress chart',
          'Right below that is a big countdown card — it shows your next occasion (like a birthday or anniversary) with how many days are left',
          'If the occasion is today, you\'ll see "Today!" and a little confetti celebration 🎉',
          'Tap the countdown card to send a card or open the occasion',
        ],
      },
      {
        heading: 'Care Reminders',
        bullets: [
          'Below the countdown, you\'ll see Care Reminders — these are prayer and health check-ins that are due',
          'Each reminder shows who it\'s for and what kind of care they need',
          'Tap the checkmark to mark it done, or tap the bell to snooze it for a day',
          'You can also draft a care card right from the reminder',
        ],
      },
      {
        heading: 'Acts of Support',
        bullets: [
          'Below care reminders, you\'ll see your Acts of Support — things you\'ve committed to doing',
          '🟠 Orange circle = overdue (you should have done this already!)',
          '🟡 Yellow circle = due soon (do this in the next day or two)',
          '🟢 Green circle = all caught up (nice job!)',
          'Tap the circle to mark an act as done',
          'You can filter by person or category using the buttons at the top of the list',
        ],
      },
      {
        heading: 'More on Home',
        bullets: [
          'Scroll down to see person date reminders (upcoming birthdays and anniversaries)',
          'One-time act reminders show things you scheduled for a specific date',
          'Birthday and anniversary reminders appear 18 days, 7 days, and 3 days out — and on the day',
          'Each of those reminders has a "Send a card" and a "Send a gift" button, so you can act right away',
          'For the full picture, open Month Ahead from Explore to see every upcoming occasion by month',
          'There\'s a daily appreciation jot — write one nice thing you\'re grateful for each day',
          'Every jot is kept in your Appreciation calendar (Calendar tab → "Appreciation") so you can look back on the good moments',
          'At the very bottom, there\'s a quick-add bar to log an act of kindness for someone in a tap',
        ],
      },
    ],
  },
  {
    title: 'Adding Your People',
    icon: 'Users',
    steps: [
      {
        heading: 'Go to Your People',
        bullets: [
          'Tap Explore at the bottom right',
          'Tap Who You Love (it looks like people standing together)',
        ],
      },
      {
        heading: 'Add a Person Manually',
        bullets: [
          'Tap the + button at the top',
          'Type their name (like "Grandpa Bob")',
          'Pick how they\'re related to you (like "Grandpa" or "Friend")',
          'Add their birthday if you know it — this is important! The app will remind you to send a card',
          'Add their anniversary if they have one',
          'You can also add their phone number and email',
          'Tap Save',
        ],
      },
      {
        heading: 'Import from Google Contacts',
        bullets: [
          'On the Who You Love page, look for the "Google Contacts" section',
          'Tap "Connect Google Contacts" and sign in to your Google account',
          'Tap "Sync contacts now" to pull in everyone from Google',
          'FinBump imports names, birthdays, anniversaries, emails, and phone numbers',
          'It adds new contacts and fills in missing info for people you already have — it never overwrites what you\'ve already entered',
          'You can sync again anytime to pick up new contacts or updated info',
          'Tap "Disconnect Google" if you want to stop syncing',
        ],
      },
      {
        heading: 'Add Details (Optional but Helpful)',
        bullets: [
          'After saving, tap on the person\'s name to open their profile',
          'You can add things they like (like "golf" or "chocolate")',
          'You can add custom details (like "allergic to peanuts" or "favorite color is blue")',
          'You can add other notes and facts that help the AI suggest gifts and messages',
          'These details help the app give you better gift ideas later!',
        ],
      },
    ],
  },
  {
    title: 'Adding Pets',
    icon: 'PawPrint',
    steps: [
      {
        heading: 'Go to Pets',
        bullets: ['Tap Explore at the bottom', 'Tap Pets'],
      },
      {
        heading: 'Add a Pet',
        bullets: [
          'Tap the + button',
          'Type the pet\'s name (like "Buddy")',
          'Pick who owns the pet (tap the person from your connections)',
          'Choose what kind of animal (dog, cat, bird, etc.)',
          'Add their birthday or "gotcha day" (adoption date)',
          'You can add things they like (like "tennis balls" or "belly rubs")',
          'Tap Save',
        ],
      },
    ],
  },
  {
    title: 'Acts of Support — The Heart of the App',
    icon: 'Heart',
    steps: [
      {
        heading: 'See Your Acts',
        bullets: [
          'Tap Home at the bottom',
          'You\'ll see a list of acts with colored circles next to them',
          '🟠 Orange circle = overdue (you should have done this already!)',
          '🟡 Yellow circle = due soon (do this in the next day or two)',
          '🟢 Green circle = all caught up (nice job!)',
        ],
      },
      {
        heading: 'Add a New Act',
        bullets: [
          'Tap the + button in the Acts of Support section on Home, or tap Acts at the bottom',
          'Pick a common act from the list, or tap "Add your own" to type your own',
          'Pick which person this is for',
          'Choose how often: Every Day, Week, Month — or "One time" for something special',
          'If you pick "One time," choose the date it\'s for (like an anniversary or a one-off surprise)',
          'Tap Save',
        ],
      },
      {
        heading: 'Mark an Act as Done',
        bullets: [
          'When you do the act, tap the circle next to it',
          'The circle will fill in and turn green',
          'The app will automatically schedule the next reminder!',
          'Give yourself a pat on the back 😊',
        ],
      },
      {
        heading: 'Filter Your Acts',
        bullets: [
          'At the top of the Acts list, you can tap buttons to see only certain acts',
          'Tap All to see everything',
          'Tap a person\'s name to see only their acts',
          'This helps you focus on one person at a time',
        ],
      },
    ],
  },
  {
    title: 'Special Dates & Calendar',
    icon: 'CalendarDays',
    steps: [
      {
        heading: 'See Your Calendar',
        bullets: [
          'Tap Calendar at the bottom',
          'You\'ll see a month calendar with colored dots on important days',
          'Blue dots are your acts of support — recurring acts show on every scheduled day, one-time acts show on their date',
          'Tap any dot to see what\'s happening that day',
        ],
      },
      {
        heading: 'Add a Special Date',
        bullets: [
          'From the Calendar, tap the + button',
          'Type what the event is (like "Grandpa\'s Birthday")',
          'Pick the date',
          'Choose what type (birthday, anniversary, holiday, etc.)',
          'Add a note if you want (like "He loves chocolate cake")',
          'Tap Save',
        ],
      },
      {
        heading: 'The Countdown Card',
        bullets: [
          'The big card at the top of Home shows your next occasion with a countdown',
          'It picks the soonest birthday, anniversary, gotcha day, or event within 30 days',
          'If it\'s a card-sending occasion (birthday, anniversary, gotcha day), the button says "Send card" and takes you straight to the card builder',
          'If it\'s another event, the button says "Open" and takes you to the calendar',
          'Below the big card, you\'ll see small chips for the next 2 occasions after that',
        ],
      },
      {
        heading: 'The Appreciation View',
        bullets: [
          'At the top of the Calendar page, tap "Appreciation"',
          'It\'s a month grid of everything you\'ve done for the people you love — completed acts of support, prayers, care check-ins, and your appreciation jots',
          'Days with something on them show a little count — tap a day to see the details',
          'Scheduled acts, prayers, and check-ins show up on their upcoming days too',
          'Use the arrows to look back at past months and see how much you\'ve been showing up',
        ],
      },
      {
        heading: 'Coming Up for One-Time Acts',
        bullets: [
          'When you schedule a "One time" act, FinBump adds it to a "Coming up" banner on Home',
          'You\'ll get reminders 30 days, 10 days, 3 days, and the day of the event',
          'One-time acts also appear on your calendar as a blue dot on their scheduled date',
        ],
      },
    ],
  },
  {
    title: 'Month Ahead — Birthdays & Anniversaries',
    icon: 'Cake',
    steps: [
      {
        heading: 'Open Month Ahead',
        bullets: [
          'Tap Explore at the bottom',
          'Tap Month Ahead (it\'s grouped under People & Pets)',
          'It lists every birthday, anniversary, and pet Gotcha Day coming up, grouped by month',
        ],
      },
      {
        heading: 'What Each Row Shows You',
        bullets: [
          'The card at the top totals what\'s happening in the next 30 days',
          'Each month has its own section — the current month is marked so you know where you are',
          'Every row shows who it\'s for, what the occasion is, and how many days away it is',
          'For a birthday you\'ll see how old they\'ll be — for an anniversary or Gotcha Day, how many years',
        ],
      },
      {
        heading: 'Send a Card or a Gift Right from the Row',
        bullets: [
          'Tap a row to see ready-made card messages for that person — copy one or open the Card Builder',
          'Tap the card button on a row to jump into the Card Builder already set to that person and occasion',
          'Tap "Send a gift" to open gift help already scoped to them: the AI Gift Finder (ideas with buy links, budgets, and tracking) or their gift ideas page',
          'For a pet\'s occasion, the gift options open for the pet\'s owner',
        ],
      },
      {
        heading: 'Reminders Come on Their Own',
        bullets: [
          'Birthdays and anniversaries show up on Home 18 days, 7 days, and 3 days before — and on the day',
          'The same reminders appear on the Month Ahead page, so nothing slips by',
          'Every one of those reminders has its own "Send a card" and "Send a gift" button',
        ],
      },
    ],
  },
  {
    title: 'Remembering Someone You Have Lost',
    icon: 'Heart',
    steps: [
      {
        heading: 'Mark Them as Remembered',
        bullets: [
          'Tap Explore at the bottom, then tap Who You Love',
          'Tap the person, then tap "Edit profile"',
          'Turn on "Remembering them"',
          'Pick the date you keep — the day they passed, or the day you last had them in your life',
          'Choose how many days ahead you want to be nudged (3 days is the default)',
          'Add a note of what you would like to do that day, like "Light a candle" or "Visit the garden"',
          'Tap Save',
        ],
      },
      {
        heading: 'What Changes, and What Stays',
        bullets: [
          'Their birthday, anniversary, gift budget and care check-in reminders step aside',
          'Their photos, notes, memories and timeline all stay exactly where they were',
          'The "Remembering (N)" button at the top of Who You Love shows everyone you are holding in memory, so they stay part of your circle',
          'Pets can be marked the same way from their own profile',
          'You can turn it back off any time with the same switch',
        ],
      },
      {
        heading: 'The Day Itself',
        bullets: [
          'Month Ahead shows a quiet "Remembering · Dates you keep" section above the birthdays',
          'A gentle reminder appears in your notifications a few days before, and again on the day',
          'Tapping the reminder opens their contact — there is no card or gift prompt on a remembrance date',
        ],
      },
    ],
  },
  {
    title: 'Sending Cards',
    icon: 'Mail',
    steps: [
      {
        heading: 'Open the Card Builder',
        bullets: [
          'Tap Explore at the bottom, then tap Cards',
          'Or tap the "Send card" button on the Home countdown card',
          'Or tap "Send a card" on any birthday or anniversary reminder',
        ],
      },
      {
        heading: 'Build a Card',
        bullets: [
          'Pick who the card is for (all your contacts show up — FinBump users have a badge)',
          'Pick the occasion (birthday, anniversary, get well, thank you, thinking of you, just because)',
          'Type some keywords to personalize the message (like "funny, warm, mentions golf")',
          'Pick a design from the visual template gallery',
          'Tap "Generate message" and the AI writes a heartfelt message for you',
          'You can edit the message or pick from pre-written message cards',
        ],
      },
      {
        heading: 'Send Your Card',
        bullets: [
          'Tap "Preview" to see how the card looks',
          'Tap "Send card" to deliver it',
          'If the person is a FinBump user, the card is delivered right in the app',
          'If they\'re not a FinBump user yet, the card is saved and you can send it another way',
          'You can see all your sent cards in the Cards list',
        ],
      },
    ],
  },
  {
    title: 'Gift Tracker',
    icon: 'Gift',
    steps: [
      {
        heading: 'Open the Gift Tracker',
        bullets: ['Tap Explore at the bottom', 'Tap Budget & Tracker'],
      },
      {
        heading: 'Add a Gift Idea',
        bullets: [
          'Tap the + button',
          'Type the gift name (like "Golf balls")',
          'Pick who it\'s for',
          'Add a price if you know it',
          'Add a link to a website where you can buy it (optional)',
          'Add a note (like "He mentioned he needs these")',
          'Tap Save',
        ],
      },
      {
        heading: 'Mark a Gift as Purchased',
        bullets: [
          'When you buy the gift, tap it and mark it as purchased',
          'The app keeps track of what you\'ve bought and what\'s still an idea',
          'You can also mark a gift as "gifted" once you\'ve given it',
        ],
      },
      {
        heading: 'AI Gift Ideas',
        bullets: [
          'Tap Explore at the bottom, then tap Ideas',
          'The app looks at everything you know about a person (their likes, details) to suggest gifts',
          'Tap any idea to save it to your gift tracker',
          'You can also browse ideas for treats, books, movies, and TV shows',
        ],
      },
    ],
  },
  {
    title: 'Prayer & Care Reminders',
    icon: 'HeartPulse',
    steps: [
      {
        heading: 'Open Care & Prayer',
        bullets: ['Tap Explore at the bottom', 'Tap Care & Prayer'],
      },
      {
        heading: 'Set Up a Prayer Reminder',
        bullets: [
          'Tap on a person in your connections',
          'Scroll down to the Prayer section',
          'Turn on the prayer toggle',
          'Type who you want to pray for (like "Grandpa Bob\'s healing")',
          'Type why (like "He\'s having surgery")',
          'Choose how often to remind you (every 3 days, every 7 days, etc.)',
          'Tap Save',
        ],
      },
      {
        heading: 'Health Check-In Reminders',
        bullets: [
          'On the same person\'s profile, find the Health section',
          'Type any health notes (like "Taking new medication")',
          'Choose how often to check in (every 7 days, etc.)',
          'The app will remind you to call and check on them!',
        ],
      },
      {
        heading: 'Other Care Reminders',
        bullets: [
          'You can also set up custom care reminders for anything',
          'Like "Remind me to send a funny joke to Grandma every Friday"',
          'Type your note, choose how often, and save!',
        ],
      },
      {
        heading: 'Add Your Own Personal Needs',
        bullets: [
          'In the Care & Prayer section, you can also add your own needs',
          'Like "Pray for my knee to heal"',
          'These can be shared with your synced connections so they can pray for you too',
        ],
      },
    ],
  },
  {
    title: 'Groups',
    icon: 'UsersRound',
    steps: [
      {
        heading: 'Create a Group',
        bullets: [
          'Tap Explore at the bottom',
          'Tap Groups',
          'Tap the + button',
          'Type a group name (like "Church Friends" or "Tennis Team")',
          'Pick an emoji and color for the group',
          'Tap Save',
        ],
      },
      {
        heading: 'Add People to a Group',
        bullets: [
          'Tap on the group you created',
          'Tap Add Members',
          'Tap each person you want in the group',
          'Tap Done',
        ],
      },
      {
        heading: 'Send a Group Message',
        bullets: [
          'Inside a group, you can tap Message Everyone',
          'Type a message and it goes to everyone in the group at once',
          'Great for "Happy Birthday" texts or group invites!',
        ],
      },
    ],
  },
  {
    title: 'Grab a Meal — Planning One Meal Together',
    icon: 'Utensils',
    steps: [
      {
        heading: 'Set Up a Gathering',
        bullets: [
          'Tap Explore at the bottom, then tap Grab a Meal',
          'Tap the + button at the top',
          'Name the meal (like "Friday dinner with the Baileys")',
          'Pick a date, type an area or place, choose the kind of food (tap a suggestion or type your own), and choose a per-person budget',
          'Add the dishes you\'re planning to the menu and write a personal note to the group',
          'Tap "Create & invite" — everyone you added gets their own private link by email',
        ],
      },
      {
        heading: 'Who You Invite',
        bullets: [
          'Anyone in your connections who has an email is suggested — just tap their name',
          'You can also type a name and email for someone who isn\'t a contact yet',
          'One guest is enough, or invite as many as you like',
          'Guests don\'t need a FinBump account to answer — they open their own private link',
          'You can copy any guest\'s private link from the gathering page to remind them yourself',
        ],
      },
      {
        heading: 'What Your Guests Answer',
        bullets: [
          'Whether they can make it: "Yes, count me in," "Maybe," or "Can\'t make it"',
          'Which days and times suit them, plus food and area preferences',
          'Their budget, any dietary needs, and an optional note',
          'They can turn reminder emails off with one tap',
        ],
      },
      {
        heading: 'See Who\'s Coming (RSVP Dashboard)',
        bullets: [
          'Tap the dashboard button (the small chart icon) at the top of Grab a Meal',
          'The first card counts your meals in the works, confirmed, waiting on answers, and invites out',
          'The RSVP card totals every open invitation: Coming, Maybe, Can\'t come, and No answer yet',
          'Each gathering is listed below with its guests grouped under their answer — so you can see at a glance exactly who accepted and who declined',
        ],
      },
      {
        heading: 'Save Your Regular Setups as Templates',
        bullets: [
          'At the bottom of the create form, tap "Save as template" to keep the menu, place, food type, budget, and message together',
          'Next time, tap that template at the top of the form and everything fills in for you',
          'Your templates live in the Templates panel on the Grab a Meal page — edit or delete them there',
        ],
      },
      {
        heading: 'Let the AI Suggest a Plan',
        bullets: [
          'Once two or more guests have answered, the gathering page offers an AI plan',
          'It suggests a place, food, and date that fit everyone, with a fit score and backup options',
          'Tap "Confirm the plan" to lock in the date, time, and place — everyone is notified',
        ],
      },
      {
        heading: 'Reminders Are Automatic',
        bullets: [
          'Guests who haven\'t answered get a friendly reminder email (at most one a day)',
          'Everyone gets a reminder before the day',
          'Anyone who turned reminders off is never emailed again',
        ],
      },
    ],
  },
  {
    title: 'My Profile',
    icon: 'User',
    steps: [
      {
        heading: 'Open Your Profile',
        bullets: ['Tap Explore at the bottom', 'Tap My Profile'],
      },
      {
        heading: 'Fill in Your Info',
        bullets: [
          'Add your birthday, anniversary, and zip code',
          'Add things you like (these help people find gifts for YOU!)',
          'Add your favorite color, flower, clothing sizes, dietary needs',
          'Add your love languages (how you like to be shown love)',
          'Add your preferred shopping locations so the AI gift finder can look there first',
        ],
      },
      {
        heading: 'Daily Encouragement',
        bullets: [
          'In your profile, find the Daily Encouragement section',
          'Turn it on to get a daily uplifting message on your Home screen',
          'You can choose if you want scripture, a story, or a simple message',
          'Pick your faith tradition if you want scripture verses',
          'This puts a little smile on your face every morning!',
        ],
      },
      {
        heading: 'Exercise Reminder',
        bullets: [
          'In the same section, you can set up exercise reminders',
          'Pick what kind of exercise you like (walking, yoga, etc.)',
          'Choose how often to remind you',
          'Write yourself an encouraging note!',
        ],
      },
      {
        heading: 'Your Language',
        bullets: [
          'At the top of your profile there\'s an English ↔ Español switch — flip it any time',
          'In Spanish the app is called ChocAleta',
          'You can also change it in Settings (Account tab → Language)',
          'Your choice follows you to every device you sign in on',
        ],
      },
      {
        heading: 'Rate FinBump',
        bullets: [
          'At the bottom of your profile, find the "Rate FinBump" section',
          'Tap the stars to give 1 to 5 stars, add a few words if you like, then tap "Submit review"',
          'Above the stars you\'ll see the average rating and how many reviews we\'ve received',
          'Your own reviews are listed below — and if we reply, you\'ll see "FinBump\'s response" underneath',
        ],
      },
    ],
  },
  {
    title: 'Take a Trip',
    icon: 'Plane',
    steps: [
      {
        heading: 'Open Take a Trip',
        bullets: ['Tap Explore at the bottom', 'Tap Take a Trip'],
      },
      {
        heading: 'Add a Trip',
        bullets: [
          'Tap the + button',
          'Type the trip name (like "Summer Beach Trip")',
          'Add the destination, start date, and end date',
          'Pick who\'s going',
          'Tap Save',
        ],
      },
      {
        heading: 'Plan Your Trip',
        bullets: [
          'Tap on the trip to open it',
          'Add flights, hotels, rental cars, and a packing list',
          'Add a budget so you don\'t overspend',
          'You can link gift ideas to the trip (like souvenirs)',
        ],
      },
      {
        heading: 'Share with Your Partner',
        bullets: [
          'If you\'re synced with your partner, turn on the Share toggle',
          'Both of you can see and edit the trip together!',
        ],
      },
    ],
  },
  {
    title: 'AI Helpers',
    icon: 'Sparkles',
    steps: [
      {
        heading: 'Message Writer',
        bullets: [
          'Tap Explore at the bottom, then tap Message Writer',
          'Pick who the message is for',
          'Pick what kind of message (birthday, thank you, thinking of you)',
          'Pick how long you want it (short, medium, long)',
          'Tap Generate — the app writes a message for you!',
          'You can copy it, edit it, or try again for a different one',
        ],
      },
      {
        heading: 'Gift Ideas (AI)',
        bullets: [
          'Tap Explore at the bottom, then tap Ideas',
          'The app looks at everything you know about the person and suggests gifts',
          'Tap any idea to save it to your gift tracker',
          'You can also browse ideas for treats, books, movies, and TV shows',
        ],
      },
      {
        heading: 'Chat Assistant',
        bullets: [
          'Tap the Sparkles button at the top of Home, or tap Explore then Help & Chat',
          'Ask any question like "What should I get Grandpa for his birthday?"',
          'The assistant knows about your connections and can give you personalized help',
        ],
      },
    ],
  },
  {
    title: 'Settings',
    icon: 'Settings',
    steps: [
      {
        heading: 'Open Settings',
        bullets: ['Tap Explore at the bottom', 'Tap Settings'],
      },
      {
        heading: 'Pick a Theme',
        bullets: [
          'Find the Theme section',
          'Tap different colors to change how the app looks',
          'Pick the one that makes you happy!',
        ],
      },
      {
        heading: 'Notifications',
        bullets: [
          'Find the Notifications section',
          'Turn on Push Notifications if you want reminders on your phone',
          'You can also set up a Daily Digest — an email summary of what\'s due',
          'Choose daily, weekly, or monthly',
        ],
      },
      {
        heading: 'Partner Sync',
        bullets: [
          'Find the Partner Sync section',
          'If you want to share your FinBump with your spouse/partner:',
          'Tap Generate Pairing Code',
          'Give the code to your partner',
          'They enter it in their app under Partner Sync',
          'Now you both see the same trips and share updates',
          'Great for church groups or prayer chains',
        ],
      },
      {
        heading: 'Accessibility',
        bullets: [
          'In Settings, find the Accessibility section',
          'Turn on High Contrast if text is hard to read',
          'Turn on Reduce Motion if animations bother you',
          'The app adjusts to make things easier to see and use',
        ],
      },
    ],
  },
  {
    title: 'Understanding Notifications',
    icon: 'Bell',
    steps: [
      {
        heading: 'The Bell Icon',
        bullets: [
          'At the top of every screen, you\'ll see a bell icon',
          'Tap it to see all your notifications',
          'Tap any notification to go straight to that reminder',
          'Swipe or tap to dismiss a notification when you\'re done',
        ],
      },
      {
        heading: 'What the Colors Mean',
        bullets: [
          '🟠 Orange/Red = Something is overdue — take care of this first!',
          '🟡 Yellow = Something is due soon — do this in the next day or two',
          '🟢 Green = You\'re all caught up — great job!',
        ],
      },
    ],
  },
];

export const GUIDE_DAILY_ROUTINE = {
  title: 'Your Daily Routine',
  icon: 'Sun',
  intro: 'Here\'s what a FinBump user should do — and what they\'ll receive — every day:',
  steps: [
    {
      heading: 'Open the App & Check Home',
      bullets: [
        'Tap Home first thing in the morning',
        'Look at the countdown card at the top — see what\'s coming up next',
        'Look for any overdue items (orange) in your Acts of Support — do those first',
        'Check for items due soon (yellow) — plan them for today',
      ],
    },
    {
      heading: 'Complete Your Acts of Support',
      bullets: [
        'Tap the circle next to each act you did today',
        'Even one act a day keeps your relationships strong',
        'Examples: "Call Mom," "Send a text to Grandpa," "Pray for sister"',
      ],
    },
    {
      heading: 'Check Your Care Reminders',
      bullets: [
        'On Home, look for Prayer, Health, and Other Care reminders',
        'These tell you who needs a check-in today',
        'Call them, text them, or pray for them — then tap to mark it done',
      ],
    },
    {
      heading: 'Read Your Daily Encouragement',
      bullets: [
        'On Home, you\'ll see a daily uplifting message',
        'It might be scripture, a story, or a kind word',
        'Take 10 seconds to read it — it\'s your little daily boost 💛',
      ],
    },
    {
      heading: 'Check the Countdown & Card Reminders',
      bullets: [
        'If someone\'s birthday or anniversary is coming up, the countdown card shows it',
        'Tap "Send card" to build and send a card before it\'s too late!',
        'Tap "Send a gift" on the reminder if a present fits better — it opens gift ideas with links to buy them',
        'Open Month Ahead (Explore → Month Ahead) to see every occasion coming up, grouped by month',
        'Below the countdown, small chips show the next 2 occasions after that',
      ],
    },
    {
      heading: 'Check Notifications (Bell Icon)',
      bullets: [
        'Tap the bell at the top to see if anything new needs your attention',
        'Dismiss notifications you\'ve handled',
      ],
    },
  ],
};

export const GUIDE_DAILY_EXPECT = {
  title: 'What to Expect Automatically',
  icon: 'Zap',
  intro: 'These things happen on their own — you don\'t have to do anything!',
  steps: [
    {
      heading: 'Daily Push Notification (if enabled)',
      bullets: [
        'One morning notification summarizing all your reminders',
        'Example: "3 reminders from FinBump: 1 overdue act, 2 prayer reminders"',
        'Tap it to open the app directly to your Home screen',
      ],
    },
    {
      heading: 'Daily Digest Email (if enabled)',
      bullets: [
        'An email summary of what\'s due today',
        'Choose daily, weekly (Mondays), or monthly (1st of month) in Settings',
        'Great for grandparents who check email more than their phone',
      ],
    },
    {
      heading: 'Fresh Daily Encouragement',
      bullets: [
        'A new message every day — it changes automatically',
        'Scripture, story, or simple encouragement based on your settings',
      ],
    },
    {
      heading: 'Updated Reminder Status',
      bullets: [
        'Acts that weren\'t completed yesterday become overdue today',
        'The app automatically recalculates what\'s due based on your intervals',
        'You don\'t have to do anything — it just knows',
      ],
    },
    {
      heading: 'Countdown Card & Card Reminders',
      bullets: [
        'The Home countdown card always shows your next occasion within 30 days',
        'Card-sending reminders appear 18 days before birthdays and anniversaries',
        'On the day of the occasion, the countdown shows "Today!" with confetti 🎉',
      ],
    },
  ],
};

export const GUIDE_CLOSING = `Remember: FinBump's slogan is "Because the little things really are the big things." Every call, every card, every prayer — it all adds up to showing people they're loved. And now you have a tool to help you never miss a chance to show you care.`;