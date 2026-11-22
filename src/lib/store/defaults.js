// Default data and constants for the FinBump store. Extracted from
// keepsakeStore.jsx (#9) so domain slices can import them independently,
// making each slice testable without the full provider.

export const STORAGE_KEY = 'keepsake_proto_v1';
export const TREAT_CATEGORIES = ['drinks', 'snacks', 'meals', 'desserts'];
export const DISMISSED_KEY = 'keepsake_notif_dismissed_v1';
export const CLICKED_KEY = 'keepsake_notif_clicked_v1';
export const READ_TTL_MS = 24 * 60 * 60 * 1000;
export const FAVORITE_IDEA_CATEGORIES = new Set(['vacationIdeas', 'getawayIdeas', 'roadTripIdeas', 'dinnerIdeas']);

// A new account is deliberately empty: no acts of kindness and no calendar
// reminders are seeded, because nothing is known about the people in their life
// yet. They start with the daily scripture, story and encouragement, and one
// nudge to begin (see buildNotifications).

export const DEFAULT_RECS = [
  { id: 'r1', title: 'Linen robe in sage', priceRange: '$65–$90', reason: 'They love cozy mornings and the color green.', img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80', link: 'https://www.amazon.com/s?k=linen+robe+sage' },
  { id: 'r2', title: 'Hand-tied dried bouquet', priceRange: '$40–$55', reason: 'Dried flowers last — and their favorite is eucalyptus.', img: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600&q=80', link: 'https://www.amazon.com/s?k=hand+tied+dried+bouquet' },
  { id: 'r3', title: 'Leather journal, monogrammed', priceRange: '$30–$48', reason: 'They write every night. This makes it feel kept.', img: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=80', link: 'https://www.amazon.com/s?k=leather+journal+monogrammed' },
];

export const DEFAULT_VACATION_IDEAS = [];
export const DEFAULT_GETAWAY_IDEAS = [];

export const DEFAULT_PROFILE = {
  name: '',
  nickname: '',
  photoUrl: '',
  phone: '',
  birthday: '',
  anniversary: '',
  zipCode: '',
  likes: ['', '', '', '', ''],
  details: [],
  notes: '',
};

export const DEFAULT_MY_PREFERENCES = {
  birthday: '',
  anniversary: '',
  zipCode: '',
  travelMode: false,
  travelDestination: '',
  amazonWishlist: '',
  likes: ['', '', ''],
  favoriteColor: '',
  favoriteFlower: '',
  sizeTop: '',
  sizeShoe: '',
  dietary: '',
  loveLanguages: [],
  details: [],
  notes: '',
  exerciseTypes: [],
  exerciseNotes: '',
  exerciseReminderDays: 0,
  pushNotifications: true,
  habitNudge: true,
  quietHoursEnabled: false,
  quietHoursStart: '21:00',
  quietHoursEnd: '07:00',
  shoppingLocations: [],
  language: 'en',
};

export const DEFAULT_SETTINGS = {
  preferredName: '',
  nickname: '',
  email: '',
  photoUrl: '',
  notifyOverdue: true,
  notifyEvents: true,
  notifyScheduledActs: true,
  digestCadence: 'weekly',
  pairingCode: '',
  migratedToBackend: false,
  syncAutosync: true,
  syncAnnualReminder: false,
  syncDateReminders: true,
  customSyncReminderDates: [],
  notifyPersonalNotes: true,
  prayerEnabled: true,
  defaultsDismissed: false,
  // On by default: a brand-new member receives the scripture, story and
  // encouragement from their first day, before they have set anything up.
  dailyEncouragement: true,
  encouragementStory: true,
  storyCategories: [],
  encouragementMessage: true,
  encouragementScripture: true,
  faithTradition: '',
  faithTraditionOther: '',
  scriptureSubject: '',
  partnerLabel: 'partner',
  friendShareSettings: { name: true, photo: true },
  theme: 'default',
  appLockEnabled: false,
  privacyBlur: false,
};

export const DEFAULT_PARTNER_DATA = {
  partnerName: null,
  people: [],
  pets: [],
  movieIdeas: [],
  bookIdeas: [],
  seriesIdeas: [],
  treatIdeas: [],
};

export const DEFAULT_STATE = {
  onboarded: false,
  isLoaded: false,
  profile: DEFAULT_PROFILE,
  myPreferences: DEFAULT_MY_PREFERENCES,
  acts: [],
  events: [],
  history: [],
  giftIdeas: [],
  personBudgets: {},
  people: [],
  pets: [],
  syncRequests: [],
  trips: [],
  milestones: [],
  personalNotes: [],
  goals: [],
  groups: [],
  commLog: [],
  movieIdeas: [],
  bookIdeas: [],
  vacationIdeas: DEFAULT_VACATION_IDEAS,
  getawayIdeas: DEFAULT_GETAWAY_IDEAS,
  roadTripIdeas: [],
  dinnerIdeas: [],
  seriesIdeas: [],
  drinks: [],
  snacks: [],
  meals: [],
  desserts: [],
  settings: DEFAULT_SETTINGS,
  memoryRefreshes: [],
  notifications: [],
  dailyEncouragementContent: null,
  personalNeeds: [],
  affiliateLinks: [],
};