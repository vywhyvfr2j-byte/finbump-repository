// Builds the FinBump launch pitch deck as a real .pptx file.
// Run: node scripts/build-launch-deck.mjs
// Output: public/finbump-launch-deck.pptx (served at /finbump-launch-deck.pptx)
import pptxgen from 'pptxgenjs';

const CREAM = 'FAF8F4';
const INK = '2E2A28';
const MUTED = '6B6B6B';
const CORAL = 'D07B6C';
const GOLD = 'E8B87A';
const TEAL = '7C9E93';
const WHITE = 'FFFFFF';
const FONT = 'Inter';

const pptx = new pptxgen();
pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE';
pptx.author = 'FinBump';
pptx.company = 'FinBump';
pptx.title = 'FinBump — Launch Deck';

const W = 13.333;
const H = 7.5;
const M = 0.95; // left/right margin

let page = 0;

function slide({ bg = CREAM, dark = false } = {}) {
  const s = pptx.addSlide();
  s.background = { color: bg };
  page += 1;
  // Footer mark + page number (skipped on the title slide)
  if (page > 1) {
    s.addText('FinBump', {
      x: M, y: H - 0.62, w: 2, h: 0.3,
      fontFace: FONT, fontSize: 9, color: dark ? 'B9B2AC' : MUTED, charSpacing: 2,
    });
    s.addText(String(page), {
      x: W - M - 1, y: H - 0.62, w: 1, h: 0.3,
      fontFace: FONT, fontSize: 9, color: dark ? 'B9B2AC' : MUTED, align: 'right',
    });
  }
  return s;
}

function eyebrow(s, text, { dark = false } = {}) {
  s.addText(text.toUpperCase(), {
    x: M, y: 0.72, w: W - M * 2, h: 0.3,
    fontFace: FONT, fontSize: 11, bold: true, charSpacing: 2.5,
    color: dark ? GOLD : CORAL,
  });
}

function headline(s, text, { dark = false, y = 1.15, size = 40, w = W - M * 2 } = {}) {
  s.addText(text, {
    x: M, y, w, h: 1.3,
    fontFace: FONT, fontSize: size, bold: true, color: dark ? WHITE : INK,
    valign: 'top', lineSpacingMultiple: 0.98,
  });
}

function sub(s, text, { dark = false, y = 2.5, size = 16, w = 9.4 } = {}) {
  s.addText(text, {
    x: M, y, w, h: 0.9,
    fontFace: FONT, fontSize: size, color: dark ? 'E6DFD9' : MUTED,
    valign: 'top', lineSpacingMultiple: 1.25,
  });
}

function bullets(s, items, { x = M, y = 3.2, w = W - M * 2, size = 15, gap = 0.62, dark = false } = {}) {
  items.forEach((item, i) => {
    const yy = y + i * gap;
    s.addShape(pptx.ShapeType.ellipse, {
      x, y: yy + 0.13, w: 0.12, h: 0.12, fill: { color: CORAL }, line: { color: CORAL },
    });
    s.addText(item, {
      x: x + 0.32, y: yy, w: w - 0.32, h: gap,
      fontFace: FONT, fontSize: size, color: dark ? 'E6DFD9' : INK,
      valign: 'top', lineSpacingMultiple: 1.1,
    });
  });
}

function rule(s, { x = M, y = 1.0, w = 1.4, color = CORAL } = {}) {
  s.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.06, fill: { color }, line: { color } });
}

function card(s, { x, y, w, h, title, body, accent = CORAL }) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: WHITE }, line: { color: 'E7E0D8', width: 1 },
  });
  s.addShape(pptx.ShapeType.rect, { x, y, w: 0.09, h, fill: { color: accent }, line: { color: accent } });
  s.addText(title, {
    x: x + 0.3, y: y + 0.22, w: w - 0.55, h: 0.4,
    fontFace: FONT, fontSize: 14, bold: true, color: INK,
  });
  s.addText(body, {
    x: x + 0.3, y: y + 0.68, w: w - 0.55, h: h - 0.85,
    fontFace: FONT, fontSize: 12, color: MUTED, valign: 'top', lineSpacingMultiple: 1.15,
  });
}

/* ---------------------------------------------------------------- 1. Title */
{
  const s = slide({ bg: INK, dark: true });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.22, h: H, fill: { color: CORAL }, line: { color: CORAL } });
  try {
    s.addImage({ path: 'public/finbump-app-icon.png', x: M, y: 1.55, w: 0.95, h: 0.95 });
  } catch { /* logo optional */ }
  s.addText('FINBUMP', {
    x: M + 1.2, y: 1.72, w: 5, h: 0.35,
    fontFace: FONT, fontSize: 14, bold: true, charSpacing: 3, color: GOLD,
  });
  s.addText('The little things\nare the big things.', {
    x: M, y: 2.75, w: 9.6, h: 2.1,
    fontFace: FONT, fontSize: 52, bold: true, color: WHITE, lineSpacingMultiple: 0.95,
  });
  s.addText('A memory vault for the people you love — launch deck · November 2026', {
    x: M, y: 5.15, w: 9.6, h: 0.4,
    fontFace: FONT, fontSize: 15, color: 'E6DFD9',
  });
  s.addShape(pptx.ShapeType.rect, { x: M, y: 4.95, w: 1.4, h: 0.06, fill: { color: CORAL }, line: { color: CORAL } });
  s.addText('finbump.online', {
    x: M, y: H - 1.05, w: 5, h: 0.3,
    fontFace: FONT, fontSize: 11, color: 'B9B2AC', charSpacing: 1,
  });
}

/* -------------------------------------------------------------- 2. Problem */
{
  const s = slide();
  eyebrow(s, 'The problem');
  headline(s, 'We do not forget the people we love.\nWe run out of attention.', { size: 36 });
  sub(s, 'The birthdays get remembered. The small, ordinary things do not — what they are carrying this week, how the appointment went, the story they told twice.', { y: 2.85, w: 10.6 });
  const y = 4.15;
  const cw = (W - M * 2 - 0.5) / 3;
  card(s, { x: M, y, w: cw, h: 2.05, title: 'Good intentions, no system', body: 'Care lives in our head, in scraps of notes, in a calendar that only knows dates. Nothing holds the person behind the date.', accent: CORAL });
  card(s, { x: M + cw + 0.25, y, w: cw, h: 2.05, title: 'Relationships drift quietly', body: 'Nobody decides to grow apart. Weeks pass, the check-in slips, and the closeness thins without a single dramatic moment.', accent: GOLD });
  card(s, { x: M + (cw + 0.25) * 2, y, w: cw, h: 2.05, title: 'The heavy seasons are loneliest', body: 'Caregiving, illness, grief and the years after a loss ask for remembering. Generic productivity tools have nothing to offer.', accent: TEAL });
}

/* --------------------------------------------------------------- 3. Insight */
{
  const s = slide({ bg: 'F3EDE6' });
  eyebrow(s, 'The insight');
  headline(s, 'The gap is not information.\nIt is the nudge at the right moment.', { size: 36 });
  sub(s, 'People do not need another contact list. They need to be reminded of the person — with warmth, at a moment they can act on, in a way that takes thirty seconds, not thirty minutes.', { y: 2.9, w: 10.4 });
  s.addShape(pptx.ShapeType.roundRect, { x: M, y: 4.25, w: W - M * 2, h: 1.55, rectRadius: 0.08, fill: { color: WHITE }, line: { color: 'E7E0D8', width: 1 } });
  s.addText('“One small act, one question at the end of the day, one reminder before a date that matters — repeated, is a relationship kept.”', {
    x: M + 0.45, y: 4.5, w: W - M * 2 - 0.9, h: 1.1,
    fontFace: FONT, fontSize: 19, italic: true, color: INK, valign: 'middle', lineSpacingMultiple: 1.15,
  });
}

/* --------------------------------------------------------------- 4. Product */
{
  const s = slide({ bg: INK, dark: true });
  eyebrow(s, 'The product', { dark: true });
  headline(s, 'FinBump turns good intentions\ninto small acts of love.', { dark: true, size: 40, w: 10.4 });
  sub(s, 'A mobile-first memory vault: the people, pets and moments that matter, with gentle nudges that keep them close. No feeds, no ads, no streak-shaming.', { dark: true, y: 3.0, w: 9.6, size: 17 });
  const y = 4.55;
  const cw = (W - M * 2 - 0.5) / 3;
  [
    ['Memory Moments', 'One question each evening: what do you want to remember from today?'],
    ['Acts of Support', 'The small things someone needs, remembered for you and re-nudged on your rhythm.'],
    ['Shared Gatherings', 'Plan a meal or a trip together — invitations, answers and a plan in one place.'],
  ].forEach(([t, b], i) => {
    const x = M + (cw + 0.25) * i;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: 1.75, rectRadius: 0.06, fill: { color: '3B3634' }, line: { color: '3B3634' } });
    s.addText(t, { x: x + 0.28, y: y + 0.22, w: cw - 0.5, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: GOLD });
    s.addText(b, { x: x + 0.28, y: y + 0.66, w: cw - 0.5, h: 0.95, fontFace: FONT, fontSize: 11.5, color: 'E6DFD9', valign: 'top', lineSpacingMultiple: 1.15 });
  });
}

/* ------------------------------------------------------------ 5. How it works */
{
  const s = slide();
  eyebrow(s, 'How it works');
  headline(s, 'Three steps, then it carries itself.', { size: 34 });
  const y = 2.6;
  const cw = (W - M * 2 - 1.0) / 3;
  [
    ['01', 'Add your people', 'Name, what they love, the dates that matter. Two minutes, and the app starts holding it for you.'],
    ['02', 'Get nudged kindly', 'A quiet prompt before a birthday, a care check-in, or an evening memory moment. Never a guilt trip.'],
    ['03', 'Keep the moment', 'Photos and words land on that person’s timeline — and come back at the end of the year as a story.'],
  ].forEach(([n, t, b], i) => {
    const x = M + (cw + 0.5) * i;
    s.addText(n, { x, y, w: cw, h: 0.5, fontFace: FONT, fontSize: 26, bold: true, color: CORAL });
    s.addText(t, { x, y: y + 0.62, w: cw, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: INK });
    s.addText(b, { x, y: y + 1.12, w: cw, h: 1.5, fontFace: FONT, fontSize: 12.5, color: MUTED, valign: 'top', lineSpacingMultiple: 1.2 });
    if (i < 2) {
      s.addShape(pptx.ShapeType.rect, { x: x + cw + 0.12, y: y + 0.9, w: 0.26, h: 0.03, fill: { color: 'D8CFC6' }, line: { color: 'D8CFC6' } });
    }
  });
  s.addShape(pptx.ShapeType.roundRect, { x: M, y: 5.3, w: W - M * 2, h: 0.95, rectRadius: 0.06, fill: { color: 'F3EDE6' }, line: { color: 'F3EDE6' } });
  s.addText('Little Steps: a guided first two weeks that teaches the habit one small lesson at a time — so the app is used, not just installed.', {
    x: M + 0.4, y: 5.45, w: W - M * 2 - 0.8, h: 0.65,
    fontFace: FONT, fontSize: 13, color: INK, valign: 'middle',
  });
}

/* ------------------------------------------------------------ 6. Surfaces */
{
  const s = slide({ bg: 'F3EDE6' });
  eyebrow(s, 'What is inside');
  headline(s, 'Built to hold a whole relationship.', { size: 34 });
  const cols = [
    ['Keep the person', ['Connections & pets, with photos', 'What they love, sizes, notes', 'Birthdays, anniversaries, gotcha days', 'Personal notes & gift tracking']],
    ['Keep the habit', ['Evening Memory Moments', 'Acts of support with reminders', 'Care, prayer and health check-ins', 'Quiet progress, no points or levels']],
    ['Keep the year', ['Timeline per person', 'Year in Moments reflection', 'Remembrance for those lost', 'Shared meals & trips together']],
  ];
  const cw = (W - M * 2 - 0.9) / 3;
  cols.forEach(([title, items], i) => {
    const x = M + (cw + 0.45) * i;
    s.addText(title, { x, y: 2.3, w: cw, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: INK });
    s.addShape(pptx.ShapeType.rect, { x, y: 2.78, w: 0.9, h: 0.05, fill: { color: CORAL }, line: { color: CORAL } });
    s.addText(items.map((t) => ({ text: t, options: { bullet: { characterCode: '2022' }, breakLine: true } })), {
      x, y: 3.05, w: cw, h: 3.1,
      fontFace: FONT, fontSize: 12.5, color: MUTED, valign: 'top', lineSpacingMultiple: 1.35,
    });
  });
}

/* --------------------------------------------------------- 7. Why different */
{
  const s = slide();
  eyebrow(s, 'Why it is different');
  headline(s, 'Everyone built a to-do list.\nWe built a keepsake.', { size: 34 });
  bullets(s, [
    'Memory-first, not task-first — the reward is the moment kept, not a box checked.',
    'No ads on any plan, ever. Nothing in the product is trying to sell the user something.',
    'A tone made for hard seasons — remembrance is designed in, not bolted on.',
    'One app for the whole circle: partner, family, friends, pets, caregivers.',
    'Useful on day one with two minutes of input, and warmer the longer it is used.',
  ], { y: 3.1, gap: 0.66, size: 14.5, w: 10.6 });
}

/* ------------------------------------------------------------ 8. Doorways */
{
  const s = slide({ bg: INK, dark: true });
  eyebrow(s, 'Who it is for', { dark: true });
  headline(s, 'Three doorways into the same vault.', { dark: true, size: 34 });
  const y = 2.7;
  const cw = (W - M * 2 - 0.6) / 3;
  [
    ['The partner', 'Couples who want to be better at noticing — the anniversary, the hard week, the small win.'],
    ['The caregiver', 'Adult children and spouses caring for someone: check-ins, appointments, what they love, kept straight.'],
    ['The remembering', 'People holding a loss who want one honest place to keep a person close, and one day a year to mark it.'],
  ].forEach(([t, b], i) => {
    const x = M + (cw + 0.3) * i;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: 2.35, rectRadius: 0.06, fill: { color: '3B3634' }, line: { color: '3B3634' } });
    s.addShape(pptx.ShapeType.rect, { x, y, w: cw, h: 0.07, fill: { color: CORAL }, line: { color: CORAL } });
    s.addText(t, { x: x + 0.3, y: y + 0.3, w: cw - 0.6, h: 0.4, fontFace: FONT, fontSize: 17, bold: true, color: WHITE });
    s.addText(b, { x: x + 0.3, y: y + 0.85, w: cw - 0.6, h: 1.3, fontFace: FONT, fontSize: 12.5, color: 'E6DFD9', valign: 'top', lineSpacingMultiple: 1.2 });
  });
  s.addText('Same product, three stories to tell. That is the launch strategy: one vault, three ways in.', {
    x: M, y: 5.35, w: W - M * 2, h: 0.6, fontFace: FONT, fontSize: 14, color: GOLD,
  });
}

/* ----------------------------------------------------------- 9. Business */
{
  const s = slide();
  eyebrow(s, 'Business model');
  headline(s, 'Low-price annual memberships, no ads.', { size: 30 });
  const y = 2.45;
  const cw = (W - M * 2 - 0.5) / 3;
  card(s, { x: M, y, w: cw, h: 1.95, title: 'Basic — $9.49 / year', body: 'Unlimited people, pets and groups; acts of support; calendar and special dates; gift tracker and notes; prayer and care check-ins. Lifetime $29.99.', accent: TEAL });
  card(s, { x: M + cw + 0.25, y, w: cw, h: 1.95, title: 'Premium — $18.99 / year', body: 'Everything in Basic plus AI gift finder, AI message and card writer, vacation planner, remembrance, Year in Moments and the FinBump assistant. Lifetime $59.99.', accent: CORAL });
  card(s, { x: M + (cw + 0.25) * 2, y, w: cw, h: 1.95, title: 'Family passes', body: 'Starter $29.99/yr, Family $44.99/yr, Super Family $49.99/yr — or a Lifetime family plan at $179.99. The gift-able tier that spreads the app.' , accent: GOLD });
  bullets(s, [
    'Every plan starts with a 7-day free trial; payments and subscriptions run through Base44 Payments.',
    'Second revenue line: affiliate links when a member buys a gift they found in the app.',
    'Distribution for a product like this is referral: the Family Pass is bought for someone you love.',
  ], { y: 4.75, gap: 0.55, size: 12.5, w: 10.8 });
}

/* ------------------------------------------------------ 10. Where we are now */
{
  const s = slide({ bg: 'F3EDE6' });
  eyebrow(s, 'Where we are');
  headline(s, 'Live, paid and ready for its first members.', { size: 30 });
  const y = 2.55;
  const marks = [
    'The app is built and published at finbump.online, with a custom domain connected.',
    'Sign in with email, Google, Microsoft, Facebook or Apple — no new password required.',
    'Memberships, free trials, cancellations and access codes are live through Base44 Payments.',
    'The full surface ships: memory moments, care reminders, occasions, meals, trips, remembrance, badges and the assistant.',
    'Native iOS and Android builds are produced from the same codebase.',
  ];
  marks.forEach((t, i) => {
    const yy = y + i * 0.72;
    s.addShape(pptx.ShapeType.ellipse, { x: M, y: yy + 0.02, w: 0.3, h: 0.3, fill: { color: TEAL }, line: { color: TEAL } });
    s.addText('✓', { x: M, y: yy + 0.01, w: 0.3, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle' });
    s.addText(t, { x: M + 0.5, y: yy - 0.02, w: 10.5, h: 0.62, fontFace: FONT, fontSize: 14, color: INK, valign: 'top', lineSpacingMultiple: 1.1 });
  });
}

/* --------------------------------------------------------- 11. Launch plan */
{
  const s = slide({ bg: INK, dark: true });
  eyebrow(s, 'Launch plan', { dark: true });
  headline(s, 'Ninety days, three channels.', { dark: true, size: 34 });
  const y = 2.5;
  const cw = (W - M * 2 - 0.6) / 3;
  [
    ['Word of mouth + referral', ['Share prompt after the first memory moment', 'Warm invite link with a written message', 'Family Pass as the gift that spreads it'], CORAL],
    ['Niche communities', ['Relationship, caregiver and aging-parent groups', 'Contribute for weeks before mentioning the app', 'Lead with remembrance and senior companion stories'], GOLD],
    ['Short-form video', ['30-second real use cases, no screen recordings', 'Two posts a week, built on the evening ritual', 'The emotional angles generic apps cannot copy'], TEAL],
  ].forEach(([t, items, accent], i) => {
    const x = M + (cw + 0.3) * i;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: 2.55, rectRadius: 0.06, fill: { color: '3B3634' }, line: { color: '3B3634' } });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.09, h: 2.55, fill: { color: accent }, line: { color: accent } });
    s.addText(t, { x: x + 0.3, y: y + 0.25, w: cw - 0.55, h: 0.6, fontFace: FONT, fontSize: 15, bold: true, color: WHITE });
    s.addText(items.map((it) => ({ text: it, options: { bullet: { characterCode: '2022' }, breakLine: true } })), {
      x: x + 0.3, y: y + 0.95, w: cw - 0.55, h: 1.4,
      fontFace: FONT, fontSize: 11.5, color: 'E6DFD9', valign: 'top', lineSpacingMultiple: 1.25,
    });
  });
  s.addText('Launch targets, first 60 days: 150 sessions a week · 50 memory moments logged a week · 30 affiliate clicks a week.', {
    x: M, y: 5.45, w: W - M * 2, h: 0.6, fontFace: FONT, fontSize: 13, color: GOLD,
  });
}

/* ------------------------------------------------------------ 12. Roadmap */
{
  const s = slide();
  eyebrow(s, 'Roadmap');
  headline(s, 'From kept moments to a daily habit.', { size: 30 });
  const rows = [
    ['Now', 'The vault, the evening ritual, care reminders, shared gatherings, remembrance — live in production.', CORAL],
    ['Next', 'Richer companion mode for older members and their families; deeper family sharing and guest passes.', GOLD],
    ['Then', 'Store releases for iOS and Android, home-screen widget for the daily prompt, and voice capture for memory moments.', TEAL],
  ];
  rows.forEach(([label, body, accent], i) => {
    const y = 2.5 + i * 1.35;
    s.addShape(pptx.ShapeType.roundRect, { x: M, y, w: 1.35, h: 0.5, rectRadius: 0.25, fill: { color: accent }, line: { color: accent } });
    s.addText(label, { x: M, y, w: 1.35, h: 0.5, fontFace: FONT, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle' });
    s.addText(body, { x: M + 1.7, y: y - 0.05, w: 9.3, h: 0.9, fontFace: FONT, fontSize: 14, color: INK, valign: 'top', lineSpacingMultiple: 1.2 });
  });
  s.addShape(pptx.ShapeType.rect, { x: M + 0.66, y: 3.1, w: 0.03, h: 2.2, fill: { color: 'E0D6CC' }, line: { color: 'E0D6CC' } });
}

/* ---------------------------------------------------------------- 13. Ask */
{
  const s = slide({ bg: INK, dark: true });
  eyebrow(s, 'The ask', { dark: true });
  headline(s, 'Help us launch it properly.', { dark: true, size: 38 });
  sub(s, 'We are opening FinBump to its first members with the product live, the payments live, and the story ready. What we are looking for:', { dark: true, y: 2.35, w: 9.8, size: 16 });
  bullets(s, [
    '[Raise amount] to fund the first 12 months of paid growth, content and the mobile store releases.',
    '[Monthly target] members in the first six months, at the annual price points above.',
    'Introductions to caregiver communities, senior-living partners and family-focused creators.',
    'Advisors who have taken a consumer subscription app from launch to its first 10,000 members.',
  ], { y: 3.45, gap: 0.68, size: 15, dark: true, w: 10.6 });
  s.addText('Amounts in brackets are ours to fill in — everything else is live today.', {
    x: M, y: H - 1.05, w: W - M * 2, h: 0.35, fontFace: FONT, fontSize: 10, color: 'B9B2AC', italic: true,
  });
}

/* ------------------------------------------------------------ 14. Closing */
{
  const s = slide({ bg: CREAM });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.22, h: H, fill: { color: CORAL }, line: { color: CORAL } });
  try {
    s.addImage({ path: 'public/finbump-app-icon.png', x: M, y: 1.5, w: 0.9, h: 0.9 });
  } catch { /* logo optional */ }
  s.addText('The little things\nare the big things.', {
    x: M, y: 2.7, w: 10, h: 2.0, fontFace: FONT, fontSize: 46, bold: true, color: INK, lineSpacingMultiple: 0.95,
  });
  s.addText('FinBump · finbump.online', {
    x: M, y: 5.15, w: 8, h: 0.4, fontFace: FONT, fontSize: 15, color: MUTED,
  });
  s.addText('Thank you.', {
    x: M, y: 5.6, w: 8, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: CORAL,
  });
}

await pptx.writeFile({ fileName: 'public/finbump-launch-deck.pptx' });
console.log('Deck written: public/finbump-launch-deck.pptx —', page, 'slides');