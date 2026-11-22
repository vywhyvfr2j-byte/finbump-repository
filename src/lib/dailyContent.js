// Static, pre-written daily encouragement content — replaces per-user LLM calls
// with curated libraries that rotate deterministically by day-of-year.
// Zero integration credits consumed. Content is selected once per day and
// reused, matching the previous LLM-based behavior without any API cost.

import { STORIES } from '@/lib/content/stories';
import { pickStoryForDay } from '@/lib/content/storyCategories';
import { isQuoteDay, pickQuoteForDay } from '@/lib/content/quotes';
import { ENCOURAGEMENT } from '@/lib/content/encouragements';
import { CHRISTIAN_SCRIPTURES } from '@/lib/content/scriptures/christian';
import { JEWISH_SCRIPTURES } from '@/lib/content/scriptures/jewish';
import { MUSLIM_SCRIPTURES } from '@/lib/content/scriptures/muslim';
import { HINDU_SCRIPTURES } from '@/lib/content/scriptures/hindu';
import { BUDDHIST_SCRIPTURES } from '@/lib/content/scriptures/buddhist';
import { OTHER_SCRIPTURES } from '@/lib/content/scriptures/other';

// Scripture libraries — 200+ verses per tradition, imported from dedicated
// files for maintainability. Each tradition rotates deterministically by
// day-of-year, so no verse repeats for ~200 days.
const SCRIPTURES = {
  christian: CHRISTIAN_SCRIPTURES,
  jewish: JEWISH_SCRIPTURES,
  muslim: MUSLIM_SCRIPTURES,
  hindu: HINDU_SCRIPTURES,
  buddhist: BUDDHIST_SCRIPTURES,
  other: OTHER_SCRIPTURES,
};

// Maps a user-requested scripture subject to synonym keywords found in the
// verse/explanation text, so "healing", "strength", "patience" etc. match
// relevant verses even when the exact word isn't in the text.
const SUBJECT_KEYWORDS = {
  healing: ['heal', 'restore', 'broken', 'wound', 'sick', 'crushed', 'mercy', 'redeem', 'redeems'],
  strength: ['strength', 'strong', 'courage', 'courageous', 'mighty', 'uphold', 'renew'],
  peace: ['peace', 'rest', 'calm', 'still', 'tranquil', 'sakina', 'quiet', 'steady'],
  hope: ['hope', 'future', 'promise', 'plans'],
  fear: ['fear', 'afraid', 'dismayed', 'frightened', 'anxious'],
  love: ['love', 'loving', 'beloved', 'loves'],
  patience: ['wait', 'patient', 'endure', 'steadfast', 'slow to anger'],
  provision: ['provide', 'provision', 'feed', 'shepherd', 'sufficien', 'enough'],
  guidance: ['guide', 'lead', 'path', 'way', 'direct', 'plans', 'make straight'],
  forgiveness: ['forgive', 'forgiveness', 'pardon', 'mercy', 'forgives all sins'],
  anxiety: ['anxious', 'anxiety', 'worry', 'cast', 'cares for you'],
  courage: ['courage', 'courageous', 'brave', 'strong', 'fear not'],
  family: ['parent', 'family', 'brother', 'children', 'mother', 'father', 'parents'],
  kindness: ['kindness', 'kind', 'generous', 'generosity', 'beneficial', 'good to all'],
  wisdom: ['wisdom', 'wise', 'understanding', 'self-knowledge'],
  gratitude: ['grateful', 'gratitude', 'thank', 'thanks', 'remember me'],
  grief: ['brokenhearted', 'crushed', 'grief', 'sorrow', 'lost', 'death', 'dies'],
  faith: ['faith', 'trust', 'believe', 'tawakkul', 'reliance'],
  joy: ['joy', 'rejoice', 'glad', 'happy', 'delight'],
  loneliness: ['alone', 'lonely', 'near', 'refuge', 'with you', 'presence'],
  purpose: ['purpose', 'plans', 'calling', 'called', 'destined', 'stature'],
  surrender: ['surrender', 'trust', 'let go', 'release', 'casting', 'cast'],
  perseverance: ['endure', 'persever', 'faint', 'weary', 'keep', 'stubborn'],
  humility: ['humble', 'humility', 'meek', 'lowly'],
  justice: ['justice', 'justly', 'fair', 'righteous'],
  generosity: ['generous', 'generosity', 'give', 'lends', 'sharing'],
  transformation: ['transform', 'become', 'change', 'renew', 'new'],
  protection: ['protect', 'stronghold', 'refuge', 'safe', 'shield', 'defend'],
  encouragement: ['encourage', 'strong', 'courage', 'do not be', 'fear not'],
  rest: ['rest', 'lie down', 'still waters', 'peace', 'sabbath', 'rests'],
};

// Returns the day-of-year (1-366) for deterministic daily rotation.
function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

// Picks daily content deterministically by day-of-year. Each content type
// rotates independently through its array, so different types cycle at
// different rates — giving more perceived variety than a single index.
export function pickDailyContent({ faithTradition, scriptureSubject, wantStory, wantMessage, wantScripture, storyCategories }) {
  const doy = dayOfYear();
  const content = {};

  if (wantStory) {
    // The story slot always carries a real story — never a quote.
    const s = pickStoryForDay(storyCategories, doy);
    if (s) {
      content.story = s.story;
      content.storySource = s.storySource;
      content.storyCategory = s.category;
    }
  }

  if (wantMessage) {
    // Two days a week the encouragement carries a friendship or loneliness
    // quote instead of the usual line, so every seven-day stretch holds at
    // least two of them.
    if (isQuoteDay(doy)) {
      const q = pickQuoteForDay(doy);
      content.encouragement = `“${q.text}” — ${q.author}`;
      content.encouragementSource = `${q.author}, ${q.source}`;
      content.encouragementIsQuote = true;
    } else {
      content.encouragement = ENCOURAGEMENT[doy % ENCOURAGEMENT.length];
    }
  }

  if (wantScripture && faithTradition) {
    const tradition = SCRIPTURES[faithTradition] || SCRIPTURES.other;
    // If a subject is specified, match it against synonym keywords (so
    // "healing", "strength", "patience" etc. find relevant verses even when
    // the exact word isn't in the text), then fall back to the full tradition.
    const subject = (scriptureSubject || '').trim().toLowerCase();
    let pool = tradition;
    if (subject) {
      const keywords = SUBJECT_KEYWORDS[subject] || [subject];
      const matches = tradition.filter(s => {
        const text = (s.scripture + ' ' + s.scriptureExplanation).toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
      if (matches.length > 0) pool = matches;
    }
    const pick = pool[doy % pool.length];
    content.scripture = pick.scripture;
    content.scriptureExplanation = pick.scriptureExplanation;
  }

  return content;
}