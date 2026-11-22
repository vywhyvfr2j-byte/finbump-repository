// Pre-written, ready-to-send card messages for the free tier. Curated so a
// user can send a warm card without spending an AI credit. Each message uses
// {name} as a placeholder for the recipient's name (replaced when picked) and
// an optional sign-off line the sender can edit before sending.
//
// Keys match the CARD_TEMPLATES keys in cardTemplates.js.

export const CARD_MESSAGE_LIBRARY = {
  birthday: [
    {
      title: 'Warm & simple',
      text: 'Happy birthday, {name}! Wishing you a year full of the people and things you love most. So glad to celebrate you today.',
    },
    {
      title: 'Milestone (sweet 16 / milestone age)',
      text: 'Happy birthday, {name}! What a milestone — you keep growing into someone genuinely wonderful. Proud of you today and every day.',
    },
    {
      title: 'Far away',
      text: 'Happy birthday, {name}! Even though we are miles apart today, you are close in my heart. Sending love and a wish for your best year yet.',
    },
    {
      title: 'Lighthearted',
      text: 'Happy birthday, {name}! Another year of being amazing — the world is luckier for it. Cake, candles, and all the good things coming your way.',
    },
  ],
  anniversary: [
    {
      title: 'Heartfelt',
      text: 'Happy anniversary, {name}. Another year, and I would choose you all over again. Thank you for being my favorite part of every day.',
    },
    {
      title: 'Milestone year',
      text: 'Happy anniversary, {name}. Every year with you is a gift I did not know I needed. Here is to us, and to all the chapters still to come.',
    },
    {
      title: 'Short & sweet',
      text: 'Happy anniversary, {name}. You are my favorite story, and I love the way it keeps getting better.',
    },
  ],
  prayer: [
    {
      title: 'Lifting you up',
      text: '{name}, I am holding you close in prayer today. May you feel surrounded by peace, strength, and love. You are not carrying this alone.',
    },
    {
      title: 'Strength & healing',
      text: 'Praying for you, {name} — for healing where you need it, strength for the hard moments, and light for the road ahead. I am here for you.',
    },
    {
      title: 'Faith & comfort',
      text: '{name}, asking God to wrap you in comfort and carry what feels heavy. Praying you feel held and known today.',
    },
    {
      title: 'Thinking of you',
      text: 'You have been on my heart, {name}. Sending love and prayers your way — for rest, for hope, and for better days ahead.',
    },
  ],
  getwell: [
    {
      title: 'Get well soon',
      text: 'Wishing you a smooth and steady recovery, {name}. Rest, heal, and know you are thought of often. Take it one day at a time.',
    },
    {
      title: 'Encouraging',
      text: 'Take all the time you need, {name}. Your only job right now is to rest and feel better. Sending you patience and gentle days.',
    },
    {
      title: 'Here for you',
      text: 'Healing takes time, {name}, and you are doing great. If there is anything I can do — a meal, a ride, or just company — say the word.',
    },
  ],
  graduation: [
    {
      title: 'Proud of you',
      text: 'Congratulations, {name}! So proud of the person you are and everything you worked for to get here. The next chapter is lucky to have you.',
    },
    {
      title: 'Big dreams',
      text: 'Happy graduation, {name}! You earned this moment. Go chase the big things — I cannot wait to cheer you on.',
    },
    {
      title: 'Short & proud',
      text: 'You did it, {name}! So much pride and so much excitement for what comes next. Congratulations.',
    },
  ],
  thankyou: [
    {
      title: 'Sincere thanks',
      text: 'Thank you, {name}. Your kindness meant more than you know, and I will not forget it. Grateful for you.',
    },
    {
      title: 'For a gift',
      text: 'Thank you so much, {name}. Your gift was thoughtful and perfect — but mostly, I am grateful it came from you.',
    },
    {
      title: 'For being there',
      text: 'Thank you for showing up, {name}. For listening, for caring, for staying. It mattered more than I can say.',
    },
  ],
  thinking: [
    {
      title: 'Just thinking of you',
      text: 'Just thinking of you, {name}, and wanted you to know. Hoping your day is a good one — you deserve it.',
    },
    {
      title: 'Missing you',
      text: 'Missing you today, {name}. Sending a little love your way until the next time we get to be together.',
    },
    {
      title: 'Checking in',
      text: 'No reason, {name} — just wanted to say I hope you are doing well, and that you are thought of with love.',
    },
  ],
  justbecause: [
    {
      title: 'You matter',
      text: 'No special occasion, {name} — just a reminder that you matter, you are loved, and the world is better with you in it.',
    },
    {
      title: 'A little joy',
      text: 'Sending a little joy your way today, {name}, just because. Hope it finds you smiling.',
    },
    {
      title: 'Grateful for you',
      text: 'Just because, {name} — thank you for being exactly who you are. Glad you are in my life.',
    },
  ],
};

// Flatten for quick lookup if needed elsewhere.
export const hasLibraryFor = (occasion) => Array.isArray(CARD_MESSAGE_LIBRARY[occasion]) && CARD_MESSAGE_LIBRARY[occasion].length > 0;

// Replace {name} placeholder with the recipient's name (or a gentle fallback).
export function fillTemplate(text, name) {
  const n = name && String(name).trim() ? String(name).trim() : 'friend';
  return text.replace(/\{name\}/g, n);
}