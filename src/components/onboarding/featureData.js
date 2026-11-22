// Feature lists for the onboarding tour. The tour is now two pages: the features
// the app already includes (AUTO_FEATURES), then the choices that are genuinely
// the user's (OPTIONAL_FEATURES). Each optional item's `selKey` matches a key in
// the Onboarding `selections` state, which is applied to a real setting or
// preference when setup finishes — so a switch turned off here really does stop
// that feature's reminders.
//
// Descriptions stay short (one line on a phone) and say what the feature does
// for the user, not what it is called in the code.

export const AUTO_FEATURES = {
  title: 'Ready from day one',
  subtitle: 'These are built in and already on. Nothing here needs setting up.',
  hint: 'Acts and reminders keep working in the background, so nothing important slips by.',
  items: [
    {
      name: 'Acts of Kindness',
      desc: 'Log the small thoughtful things you do, and check each one off when it is done.',
    },
    {
      name: 'Smart Reminders',
      desc: 'A gentle nudge before every birthday, anniversary, and care check-in.',
    },
    {
      name: 'Month Ahead',
      desc: 'Every occasion coming up, in one clear calendar view.',
    },
    {
      name: 'Who You Love',
      desc: 'Your people, pets, and their important dates, all in one place.',
    },
    {
      name: 'Timeline',
      desc: 'Your acts, notes, and milestones in the order they happened.',
    },
    {
      name: 'Cards',
      desc: 'Send a quick card for a birthday or a just-because moment.',
    },
    {
      name: 'Gift Budget & Tracker',
      desc: 'Gather gift ideas and keep an eye on what you have spent.',
    },
    {
      name: 'Relationship Notes',
      desc: 'Shared goals and private notes for your closest relationship.',
    },
    {
      name: 'Progress',
      desc: 'See your support streaks and consistency over time.',
    },
  ],
};

export const OPTIONAL_FEATURES = {
  title: 'Make it yours',
  subtitle: 'Turn on what helps you and leave the rest off. You can change any of these later in Settings.',
  items: [
    {
      name: 'Memory Moments',
      desc: 'One gentle question each evening, saved to your private timeline.',
      selKey: 'memory',
    },
    {
      name: 'Personal Notes',
      desc: 'A private place for appreciation notes only you can see.',
      selKey: 'notes',
    },
    {
      name: 'Care & Prayer',
      desc: 'Reminders to pray for and check in on the people you love.',
      selKey: 'prayer',
    },
    {
      name: 'Scripture',
      desc: 'A daily verse and reflection inside your daily encouragement.',
      selKey: 'scripture',
    },
  ],
};

// Shared poster still shown on every premium demo card until a real screen
// recording is dropped in as `videoUrl` on the item below.
export const PREMIUM_POSTER =
  'https://media.base44.com/images/public/6a51288bdcecc77c014539fd/4fa9eca4b_generated_627bb1bd.png';

export const PREMIUM_GROUPS = [
  {
    title: 'AI-powered help',
    subtitle: 'Premium add-ons that do the thinking for you.',
    items: [
      {
        name: 'AI Gift Finder',
        desc: "Personalized gift ideas matched to each contact's likes and budget.",
        to: '/ideas',
        videoUrl: '',
      },
      {
        name: 'AI Message Writer',
        desc: 'Thoughtful, heartfelt messages written for you in your own tone.',
        to: '/message-writer',
        videoUrl: '',
      },
      {
        name: 'Chat Assistant',
        desc: 'Ask anything about the app and get instant guided answers.',
        to: '/chat',
        videoUrl: '',
      },
    ],
  },
  {
    title: 'Plan together',
    subtitle: 'Premium planning for meals and trips.',
    items: [
      {
        name: 'Group Meals',
        desc: 'Plan dinners out with friends and let AI pick the spot.',
        to: '/meals',
        videoUrl: '',
      },
      {
        name: 'Vacation Planner',
        desc: 'Map trips, hotels, and packing lists with smart AI suggestions.',
        to: '/vacation-planner',
        videoUrl: '',
      },
    ],
  },
  {
    // Remembering someone who has passed is part of Premium, so it is never
    // presented as a built-in extra. Their photos, notes and timeline stay, and
    // birthdays and check-ins step aside for one quiet date each year.
    title: 'Remember & keep',
    subtitle: 'Premium ways to hold on to the people you have lost.',
    items: [
      {
        name: 'Remembrance',
        desc: 'Keep someone close with one quiet date a year, their photos, and a note of what you would like to do.',
        to: '/remembering',
        videoUrl: '',
      },
    ],
  },
];