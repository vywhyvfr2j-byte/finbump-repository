// Verbatim public-domain quotes on friendship, loyalty and loneliness, used by
// the daily encouragement feed. They rotate into the "Daily encouragement"
// slot on two fixed days of each week, so every seven-day stretch carries at
// least two quotes. The story slot always keeps a real story.
//
// Sources are the older public-domain editions (Ross, Shuckburgh, Falconer,
// Gummere, Hicks, Cotton, Trotter, Legge) and the King James Version.
// The text is reproduced as compiled; wording varies between translations.

export const QUOTES = [
  // ── What friendship is ──
  { text: 'What is a friend? A single soul dwelling in two bodies.', author: 'Aristotle', source: 'as reported by Diogenes Laertius, Lives of Eminent Philosophers, Book V (c. 3rd century)' },
  { text: 'For without friends no one would choose to live, though he had all other goods.', author: 'Aristotle', source: 'Nicomachean Ethics, Book VIII, ch. 1 (trans. W. D. Ross)' },
  { text: 'His friend is another self.', author: 'Aristotle', source: 'Nicomachean Ethics, Book IX, ch. 4 (trans. W. D. Ross)' },
  { text: 'For friendship is nothing else than an accord in all things, human and divine, conjoined with mutual goodwill and affection.', author: 'Cicero', source: 'On Friendship (De Amicitia), ch. 6 (trans. W. A. Falconer, 1923)' },
  { text: 'He who looks upon a true friend, looks, as it were, upon a sort of image of himself.', author: 'Cicero', source: 'On Friendship, ch. 7 (trans. E. S. Shuckburgh)' },
  { text: 'A friend is a person with whom I may be sincere. Before him I may think aloud.', author: 'Ralph Waldo Emerson', source: '"Friendship," Essays: First Series (1841)' },
  { text: 'A friend may well be reckoned the masterpiece of nature.', author: 'Ralph Waldo Emerson', source: '"Friendship," Essays: First Series (1841)' },
  { text: 'If a man should importune me to give a reason why I loved him, I find it could no otherwise be expressed, than by making answer: because it was he, because it was I.', author: 'Michel de Montaigne', source: '"Of Friendship," Essays (1580; trans. Charles Cotton, 1685)' },
  { text: 'The language of friendship is not words but meanings.', author: 'Henry David Thoreau', source: 'A Week on the Concord and Merrimack Rivers (1849)' },
  { text: 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.', author: 'Proverbs 27:17', source: 'King James Version' },
  { text: 'No receipt openeth the heart, but a true friend.', author: 'Francis Bacon', source: '"Of Friendship," Essays (1625)' },
  { text: 'There can be no Friendship where there is no Freedom.', author: 'William Penn', source: 'Some Fruits of Solitude (1693)' },
  { text: 'Friendship is a sheltering tree.', author: 'Samuel Taylor Coleridge', source: '"Youth and Age" (1828)' },
  { text: "The better part of one's life consists of his friendships.", author: 'Abraham Lincoln', source: 'letter to Joseph Gillespie (1849)' },
  { text: 'My friends are my estate.', author: 'Emily Dickinson', source: 'letter to Samuel Bowles (1858)' },
  { text: 'Your friend is your needs answered.', author: 'Kahlil Gibran', source: '"On Friendship," The Prophet (1923)' },
  { text: 'And let there be no purpose in friendship save the deepening of the spirit.', author: 'Kahlil Gibran', source: '"On Friendship," The Prophet (1923)' },
  { text: 'Of all the means which are procured by wisdom to ensure happiness throughout the whole of life, by far the most important is friendship.', author: 'Epicurus', source: 'Principal Doctrines 27, in Diogenes Laertius, Lives, Book X (trans. R. D. Hicks, 1925)' },
  { text: 'Oh, the comfort, the inexpressible comfort of feeling safe with a person; having neither to weigh thoughts nor measure words, but pouring them all right out, just as they are, chaff and grain together.', author: 'Dinah Maria Craik', source: 'A Life for a Life (1859)' },
  { text: 'Friendship is the marriage of the soul, and this marriage is liable to divorce.', author: 'Voltaire', source: 'Philosophical Dictionary, "Friendship" (1764)' },
  { text: 'Life has no pleasure higher or nobler than that of friendship.', author: 'Samuel Johnson', source: 'The Idler, No. 23 (1758)' },
  { text: "I have perceiv'd that to be with those I like is enough.", author: 'Walt Whitman', source: '"I Sing the Body Electric," Leaves of Grass (1855; 1867 text)' },

  // ── Making friends ──
  { text: 'The only reward of virtue is virtue; the only way to have a friend is to be one.', author: 'Ralph Waldo Emerson', source: '"Friendship," Essays: First Series (1841)' },
  { text: 'A man that hath friends must shew himself friendly: and there is a friend that sticketh closer than a brother.', author: 'Proverbs 18:24', source: 'King James Version' },
  { text: 'A wish for friendship may arise quickly, but friendship does not.', author: 'Aristotle', source: 'Nicomachean Ethics, Book VIII, ch. 3 (trans. W. D. Ross)' },
  { text: "Men cannot know each other till they have 'eaten salt together.'", author: 'Aristotle', source: 'Nicomachean Ethics, Book VIII, ch. 3 (trans. W. D. Ross)' },
  { text: 'If you would be loved, love.', author: 'Seneca', source: 'quoting Hecato, Moral Letters to Lucilius, Letter 9 (trans. Richard M. Gummere, 1917)' },
  { text: 'After friendship is formed you must trust; before friendship is formed you must pass judgment.', author: 'Seneca', source: 'Moral Letters to Lucilius, Letter 3 (trans. Richard M. Gummere, 1917)' },
  { text: 'True friendship is a plant of slow growth, and must undergo and withstand the shocks of adversity, before it is entitled to the appellation.', author: 'George Washington', source: 'letter to Bushrod Washington, January 15, 1783' },
  { text: 'Be courteous to all, but intimate with few, and let those few be well tried before you give them your confidence.', author: 'George Washington', source: 'letter to Bushrod Washington, January 15, 1783' },
  { text: 'Be slow in chusing a Friend, slower in changing.', author: 'Benjamin Franklin', source: "Poor Richard's Almanack (1734)" },
  { text: 'If thou wouldest get a friend, prove him first, and be not hasty to credit him.', author: 'Sirach (Ecclesiasticus) 6:7', source: 'King James Version, Apocrypha' },
  { text: "Kindred spirits are not so scarce as I used to think. It's splendid to find out there are so many of them in the world.", author: 'L. M. Montgomery', source: 'Anne of Green Gables (1908)' },
  { text: 'A bosom friend—an intimate friend, you know—a really kindred spirit to whom I can confide my inmost soul.', author: 'L. M. Montgomery', source: 'Anne of Green Gables (1908)' },
  { text: "I'm Nobody! Who are you? / Are you – Nobody – too? / Then there's a pair of us!", author: 'Emily Dickinson', source: '"I\'m Nobody! Who are you?" (c. 1861; published 1891)' },
  { text: 'Is it not delightful to have friends coming from distant quarters?', author: 'Confucius', source: 'Analects, Book I (trans. James Legge, 1861)' },
  { text: 'Have no friends not equal to yourself.', author: 'Confucius', source: 'Analects, Book I (trans. James Legge, 1861)' },
  { text: 'I choose my friends for their good looks, my acquaintances for their good characters, and my enemies for their good intellects.', author: 'Oscar Wilde', source: 'The Picture of Dorian Gray (1890)' },
  { text: 'For what is your friend that you should seek him with hours to kill? Seek him always with hours to live.', author: 'Kahlil Gibran', source: '"On Friendship," The Prophet (1923)' },
  { text: 'I had three chairs in my house; one for solitude, two for friendship, three for society.', author: 'Henry David Thoreau', source: 'Walden (1854)' },
  { text: 'One friend in a lifetime is much; two are many; three are hardly possible.', author: 'Henry Adams', source: 'The Education of Henry Adams (1907)' },
  { text: 'Words are easy, like the wind; / Faithful friends are hard to find.', author: 'Richard Barnfield', source: '"As it fell upon a day," printed in The Passionate Pilgrim (1599)' },
  { text: "I'll try a pagan friend, thought I, since Christian kindness has proved but hollow courtesy.", author: 'Herman Melville', source: 'Moby-Dick, ch. 10, "A Bosom Friend" (1851)' },

  // ── Keeping friends ──
  { text: 'If a man does not make new acquaintance as he advances through life, he will soon find himself left alone. A man, Sir, should keep his friendship in constant repair.', author: 'Samuel Johnson', source: 'in James Boswell, The Life of Samuel Johnson (1791)' },
  { text: 'Those friends thou hast, and their adoption tried, / Grapple them unto thy soul with hoops of steel.', author: 'William Shakespeare', source: 'Hamlet, Act 1, Scene 3 (c. 1600)' },
  { text: 'We take care of our health, we lay up money, we make our roof tight and our clothing sufficient, but who provides wisely that he shall not be wanting in the best property of all—friends?', author: 'Ralph Waldo Emerson', source: '"Domestic Life," Society and Solitude (1870)' },
  { text: 'It is one of the blessings of old friends that you can afford to be stupid with them.', author: 'Ralph Waldo Emerson', source: 'Journals (1836)' },
  { text: 'Happy is the house that shelters a friend!', author: 'Ralph Waldo Emerson', source: '"Friendship," Essays: First Series (1841)' },
  { text: "We must be our own before we can be another's.", author: 'Ralph Waldo Emerson', source: '"Friendship," Essays: First Series (1841)' },
  { text: 'The most I can do for my friend is simply to be his friend.', author: 'Henry David Thoreau', source: 'A Week on the Concord and Merrimack Rivers (1849)' },
  { text: "Thine own friend, and thy father's friend, forsake not.", author: 'Proverbs 27:10', source: 'King James Version' },
  { text: 'He that covereth a transgression seeketh love; but he that repeateth a matter separateth very friends.', author: 'Proverbs 17:9', source: 'King James Version' },
  { text: 'Forsake not an old friend; for the new is not comparable to him: a new friend is as new wine; when it is old, thou shalt drink it with pleasure.', author: 'Sirach (Ecclesiasticus) 9:10', source: 'King James Version, Apocrypha' },
  { text: 'Should auld acquaintance be forgot, / And never brought to mind?', author: 'Robert Burns', source: '"Auld Lang Syne" (1788)' },
  { text: 'Sir, more than kisses, letters mingle souls.', author: 'John Donne', source: '"To Sir Henry Wotton" (c. 1598)' },
  { text: "A friend should bear his friend's infirmities, / But Brutus makes mine greater than they are.", author: 'William Shakespeare', source: 'Julius Caesar, Act 4, Scene 3 (1599)' },
  { text: 'I count myself in nothing else so happy / As in a soul remembering my good friends.', author: 'William Shakespeare', source: 'Richard II, Act 2, Scene 3 (c. 1595)' },
  { text: 'The holy passion of Friendship is of so sweet and steady and loyal and enduring a nature that it will last through a whole lifetime, if not asked to lend money.', author: 'Mark Twain', source: "Pudd'nhead Wilson (1894)" },
  { text: 'What do we live for, if it is not to make life less difficult to each other?', author: 'George Eliot', source: 'Middlemarch, ch. 72 (1871–72)' },
  { text: 'And in the sweetness of friendship let there be laughter, and sharing of pleasures.', author: 'Kahlil Gibran', source: '"On Friendship," The Prophet (1923)' },
  { text: 'And let your best be for your friend.', author: 'Kahlil Gibran', source: '"On Friendship," The Prophet (1923)' },
  { text: 'When you part from your friend, you grieve not; for that which you love most in him may be clearer in his absence, as the mountain to the climber is clearer from the plain.', author: 'Kahlil Gibran', source: '"On Friendship," The Prophet (1923)' },
  { text: 'And the song, from beginning to end, / I found again in the heart of a friend.', author: 'Henry Wadsworth Longfellow', source: '"The Arrow and the Song" (1845)' },
  { text: "It is more shameful to distrust one's friends than to be deceived by them.", author: 'François de La Rochefoucauld', source: 'Maxims, No. 84 (1665)' },
  { text: 'There are three faithful friends—an old wife, an old dog, and ready money.', author: 'Benjamin Franklin', source: "Poor Richard's Almanack (1738)" },

  // ── Friends in hard times, loyalty and honesty ──
  { text: 'A friend loveth at all times, and a brother is born for adversity.', author: 'Proverbs 17:17', source: 'King James Version' },
  { text: 'Faithful are the wounds of a friend; but the kisses of an enemy are deceitful.', author: 'Proverbs 27:6', source: 'King James Version' },
  { text: "Ointment and perfume rejoice the heart: so doth the sweetness of a man's friend by hearty counsel.", author: 'Proverbs 27:9', source: 'King James Version' },
  { text: 'A faithful friend is a strong defence: and he that hath found such an one hath found a treasure.', author: 'Sirach (Ecclesiasticus) 6:14', source: 'King James Version, Apocrypha' },
  { text: 'Whither thou goest, I will go; and where thou lodgest, I will lodge.', author: 'Ruth 1:16', source: 'King James Version' },
  { text: 'Greater love hath no man than this, that a man lay down his life for his friends.', author: 'John 15:13', source: 'King James Version' },
  { text: 'A threefold cord is not quickly broken.', author: 'Ecclesiastes 4:12', source: 'King James Version' },
  { text: 'Friendship adds a brighter radiance to prosperity and lessens the burden of adversity by dividing and sharing it.', author: 'Cicero', source: 'On Friendship, ch. 6 (trans. E. S. Shuckburgh)' },
  { text: 'Friendship improves happiness, and abates misery, by doubling our joys, and dividing our grief.', author: 'Joseph Addison', source: 'The Spectator, No. 68 (1711)' },
  { text: "This communicating of a man's self to his friend works two contrary effects; for it redoubleth joys, and cutteth griefs in halfs.", author: 'Francis Bacon', source: '"Of Friendship," Essays (1625)' },
  { text: 'For what purpose, then, do I make a man my friend? In order to have some one for whom I may die, whom I may follow into exile.', author: 'Seneca', source: 'Moral Letters to Lucilius, Letter 9 (trans. Richard M. Gummere, 1917)' },
  { text: 'No good thing is pleasant to possess, without friends to share it.', author: 'Seneca', source: 'Moral Letters to Lucilius, Letter 6 (trans. Richard M. Gummere, 1917)' },
  { text: 'Grief can take care of itself, but to get the full value of a joy you must have somebody to divide it with.', author: 'Mark Twain', source: 'Following the Equator (1897)' },
  { text: "Anybody can sympathise with the sufferings of a friend, but it requires a very fine nature to sympathise with a friend's success.", author: 'Oscar Wilde', source: 'The Soul of Man Under Socialism (1891)' },
  { text: 'Friendship is precious, not only in the shade, but in the sunshine of life.', author: 'Thomas Jefferson', source: 'letter to Maria Cosway, "Dialogue Between My Head and My Heart" (1786)' },
  { text: 'A true friend freely advises justly, assists readily, adventures boldly, takes all patiently, defends courageously, and continues a friend unchangeably.', author: 'William Penn', source: 'Some Fruits of Solitude (1693)' },
  { text: 'Opposition is true Friendship.', author: 'William Blake', source: 'The Marriage of Heaven and Hell (1790)' },
  { text: 'I was angry with my friend: / I told my wrath, my wrath did end.', author: 'William Blake', source: '"A Poison Tree," Songs of Experience (1794)' },
  { text: 'But if the while I think on thee, dear friend, / All losses are restor\'d and sorrows end.', author: 'William Shakespeare', source: 'Sonnet 30 (1609)' },
  { text: "'Tis better to have loved and lost / Than never to have loved at all.", author: 'Alfred, Lord Tennyson', source: 'In Memoriam A.H.H. (1850), written in grief for his friend Arthur Hallam' },
  { text: 'Most friendship is feigning, most loving mere folly.', author: 'William Shakespeare', source: 'As You Like It, Act 2, Scene 7 (c. 1599)' },
  { text: 'Friendship is certainly the finest balm for the pangs of disappointed love.', author: 'Jane Austen', source: 'Northanger Abbey (1817)' },
  { text: 'My friends have made the story of my life.', author: 'Helen Keller', source: 'The Story of My Life (1903)' },

  // ── Loneliness and solitude ──
  { text: 'It is not good that the man should be alone.', author: 'Genesis 2:18', source: 'King James Version' },
  { text: 'Two are better than one… For if they fall, the one will lift up his fellow: but woe to him that is alone when he falleth; for he hath not another to help him up.', author: 'Ecclesiastes 4:9–10', source: 'King James Version' },
  { text: 'No man is an island, entire of itself; every man is a piece of the continent, a part of the main.', author: 'John Donne', source: 'Devotions upon Emergent Occasions, Meditation XVII (1624)' },
  { text: 'For a crowd is not company; and faces are but a gallery of pictures; and talk but a tinkling cymbal, where there is no love.', author: 'Francis Bacon', source: '"Of Friendship," Essays (1625)' },
  { text: 'It is a mere and miserable solitude to want true friends; without which the world is but a wilderness.', author: 'Francis Bacon', source: '"Of Friendship," Essays (1625)' },
  { text: 'Whosoever is delighted in solitude, is either a wild beast or a god.', author: 'Francis Bacon', source: '"Of Friendship," Essays (1625), adapting Aristotle\'s Politics' },
  { text: 'I have no friend, Margaret.', author: 'Mary Shelley', source: 'Frankenstein, Letter 2 (1818)' },
  { text: 'I am alone and miserable; man will not associate with me.', author: 'Mary Shelley', source: 'Frankenstein, ch. 17 (1818)' },
  { text: 'Everywhere I see bliss, from which I alone am irrevocably excluded.', author: 'Mary Shelley', source: 'Frankenstein, ch. 10 (1818)' },
  { text: 'Alone, alone, all, all alone, / Alone on a wide wide sea!', author: 'Samuel Taylor Coleridge', source: 'The Rime of the Ancient Mariner (1798)' },
  { text: 'They flash upon that inward eye / Which is the bliss of solitude.', author: 'William Wordsworth', source: '"I Wandered Lonely as a Cloud" (1807)' },
  { text: 'I never found the companion that was so companionable as solitude.', author: 'Henry David Thoreau', source: 'Walden (1854)' },
  { text: 'I find it wholesome to be alone the greater part of the time.', author: 'Henry David Thoreau', source: 'Walden (1854)' },
  { text: 'The Soul selects her own Society — / Then — shuts the Door.', author: 'Emily Dickinson', source: '"The Soul selects her own Society" (c. 1862; published 1890)' },
  { text: 'A dinner of meats without the company of a friend is like the life of a lion or a wolf.', author: 'Epicurus', source: 'quoted by Seneca, Moral Letters to Lucilius, Letter 19 (trans. Richard M. Gummere, 1917)' },
  { text: 'All the unhappiness of men arises from one single fact, that they cannot stay quietly in their own chamber.', author: 'Blaise Pascal', source: 'Pensées, No. 139 (1670; trans. W. F. Trotter, 1910)' },
  { text: 'No more my splintered heart and maddened hand were turned against the wolfish world. This soothing savage had redeemed it.', author: 'Herman Melville', source: 'Moby-Dick, ch. 10 (1851)' },
  { text: "When, in disgrace with fortune and men's eyes, / I all alone beweep my outcast state.", author: 'William Shakespeare', source: 'Sonnet 29 (1609)' },
  { text: "For thy sweet love remember'd such wealth brings / That then I scorn to change my state with kings.", author: 'William Shakespeare', source: 'Sonnet 29 (1609)' },
  { text: 'Secret, and self-contained, and solitary as an oyster.', author: 'Charles Dickens', source: 'A Christmas Carol (1843), describing Scrooge' },
  { text: 'I am lost without my Boswell.', author: 'Arthur Conan Doyle', source: '"A Scandal in Bohemia" (1891), Sherlock Holmes on Dr. Watson' },
];

// Two fixed days per week (any seven-day window contains exactly one of each
// weekday), so the daily feed always carries at least two quotes a week.
const QUOTE_DAYS = [2, 5];

export function isQuoteDay(dayOfYear) {
  return QUOTE_DAYS.includes(dayOfYear % 7);
}

// Walks the quote list one step per quote day, so quotes don't repeat until
// the whole library has been shown.
export function pickQuoteForDay(dayOfYear) {
  const weeks = Math.floor(dayOfYear / 7);
  const slot = dayOfYear % 7 === QUOTE_DAYS[1] ? 1 : 0;
  return QUOTES[(weeks * 2 + slot) % QUOTES.length];
}