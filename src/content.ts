// ============================================================
//  WHAT IS PRINTED ON EACH PAGE
//
//  The magazine has 22 pages + the inside back cover (23 entries).
//  Each page is one block below. Change the words freely.
//  `photo: 4` means photo-4.jpg.  Every photo (1 to 20) is used once.
//  Page numbers in the Contents page = position in this list + 1.
//  Colours: bg (background), ink (text), accent (highlight). Names come from theme in data.ts.
//  Keep text short: it has to fit the page. Letters: about 350 characters is the limit.
// ============================================================
import { theme as t } from './data'

export const pages: PageSpec[] = [
  // PAGE 1 — COVER
  { layout: 'cover', photo: 1, badge: 'The love issue',
    lines: ['10 things I like about you', 'Our year, in print', 'The love letter inside', 'Plus: the playlist'] },

  // PAGE 2 — TABLE OF CONTENTS
  { layout: 'contents', photo: 2, bg: t.cream, accent: t.crimson, items: [
    { page: 3, title: "Editor's letter", desc: 'Why this magazine exists' },
    { page: 5, title: '10 things I like about you', desc: 'The list, finally' },
    { page: 7, title: 'The interview', desc: 'Quick questions, honest answers' },
    { page: 8, title: 'How it started', desc: 'A coffee that lasted three hours' },
    { page: 9, title: 'The spring edit', desc: 'Small moments in focus' },
    { page: 10, title: 'By the numbers', desc: 'A year, counted' },
    { page: 11, title: 'Our year in seven dates', desc: 'The timeline' },
    { page: 13, title: 'A love letter', desc: 'Handwritten, unedited' },
    { page: 15, title: 'Our playlist', desc: 'Songs on repeat' },
    { page: 16, title: 'Postcards', desc: 'Wish you were here' },
  ] },

  // PAGE 3 — EDITOR'S LETTER
  { layout: 'letter', kicker: "Editor's letter", title: 'Dear you,', photo: 3, bg: t.cream, accent: t.crimson,
    standfirst: 'Some years are best remembered in pictures.',
    body: 'This issue gathers twenty of them, in the order they happened. It is part scrapbook, part love letter, and entirely yours. Turn slowly. Look twice. Every frame has a story that did not fit in the caption, so I wrote the stories down too. Some of them are funny. A few are embarrassing. All of them are true. Thank you for being the reason this issue exists.',
    signoff: 'Always, K.' },

  // PAGE 4 — FULL PHOTO
  { layout: 'full', photo: 4, kicker: 'The love issue', title: 'Every frame, a little confession', accent: t.crimson },

  // PAGE 5 — THE LIST
  { layout: 'list', kicker: 'Feature', title: '10 things I like about you', photo: 5, bg: t.blush, accent: t.crimson, items: [
    'The way you laugh before the joke ends', 'Your terrible, wonderful playlists', 'How you remember the small things',
    'Your sleepy morning voice', 'Hands that are always warm', 'That you share your fries',
    'The way you say my name', 'How plain days feel special', 'Your stubborn optimism', 'That you chose me back'] },

  // PAGE 6 — FULL PHOTO
  { layout: 'full', photo: 6, kicker: 'Sundays', title: 'Nowhere to be, nobody else', accent: t.butter },

  // PAGE 7 — INTERVIEW
  { layout: 'qa', kicker: 'The interview', title: 'Quick questions', photo: 7, bg: t.cream, accent: t.crimson, items: [
    { q: 'First impression?', a: 'Tall, nervous, kind.' },
    { q: 'Favorite shared meal?', a: 'Anything eaten off one plate.' },
    { q: 'Song of the year?', a: 'Ask the music player.' },
    { q: 'Next adventure?', a: 'Somewhere with a sea.' } ] },

  // PAGE 8 — STORY
  { layout: 'split', photo: 8, kicker: 'Story', title: 'How it started', bg: t.butter, accent: t.crimson,
    standfirst: 'It was supposed to be a quick coffee.',
    text: 'Three hours later the cafe was closing and neither of us had checked the time once. We talked about nothing and everything: bad bosses, good bread, the town we both swore we would leave. When the lights flicked off, you asked if I wanted to walk. I said yes before you finished the sentence. That was the whole plot. The rest is just us, getting better at it.' },

  // PAGE 9 — PHOTO GRID (3 photos)
  { layout: 'collage', kicker: 'Gallery', title: 'The spring edit', photos: [9, 10, 11], bg: t.sky, accent: t.crimson,
    text: 'Three ordinary days that turned out to be the good ones. A rainy walk, a train we almost missed, and the exact shade of light that makes everything look like a film. Nobody posed. Nobody had to.' },

  // PAGE 10 — NUMBERS
  { layout: 'stats', kicker: 'Infographic', title: 'By the numbers', photo: 12, bg: t.cream, accent: t.crimson, items: [
    { n: '365', label: 'days together' }, { n: '1,204', label: 'good morning texts' },
    { n: '47', label: 'coffees shared' }, { n: '3', label: 'cities visited' },
    { n: '12', label: 'songs on repeat' }, { n: '1', label: 'you' } ] },

  // PAGE 11 — TIMELINE
  { layout: 'timeline', kicker: 'Timeline', title: 'Our year in seven dates', photo: 13, bg: t.blush, accent: t.crimson, items: [
    { date: 'Oct 12', text: 'The coffee that lasted three hours' },
    { date: 'Nov 03', text: 'First real fight, first real apology' },
    { date: 'Dec 25', text: 'Matching terrible sweaters' },
    { date: 'Feb 14', text: 'Dinner we burned (we ate it anyway)' },
    { date: 'Apr 02', text: 'The trip with the wrong map' },
    { date: 'Jul 19', text: 'You met my family. They loved you.' },
    { date: 'Oct 12', text: 'Here we are, one issue later' } ] },

  // PAGE 12 — FULL PHOTO
  { layout: 'full', photo: 14, kicker: 'Golden hour', title: 'The light was on our side', accent: t.sky },

  // PAGE 13 — HANDWRITTEN LOVE LETTER
  { layout: 'loveletter', photo: 15, title: 'My dearest,', bg: t.sage,
    body: 'I am not good at speeches, so I made a magazine. You are the best thing that ever happened to my ordinary days. Thank you for the quiet nights, the loud laughs, and every time you pretended not to notice me staring.',
    signoff: 'Yours, always', ps: 'P.S. You still owe me a fry.' },

  // PAGE 14 — BIG QUOTE
  { layout: 'quote', photo: 16, quote: 'Home is wherever you are.', by: 'Every page, really', bg: t.peach, accent: t.crimson },

  // PAGE 15 — PLAYLIST
  { layout: 'tracklist', kicker: 'Soundtrack', title: 'Our playlist', photo: 17, bg: t.nearBlack, ink: t.warmWhite, accent: t.butter, items: [
    { title: 'The song from the long way home', note: 'Side A, track 1' },
    { title: 'Kitchen dance, no shoes', note: 'You hummed it for weeks' },
    { title: 'Rainy bus ride', note: 'Headphones shared' },
    { title: 'The one you pretend not to love', note: 'Skip? Never' },
    { title: 'Road trip, window down', note: 'Loud on purpose' },
    { title: 'Sunday morning slow', note: 'Coffee soundtrack' },
    { title: 'Candles and bad singing', note: 'Anniversary mix' },
    { title: 'Still going', note: 'Hidden track' } ] },

  // PAGE 16 — PHOTO GRID (2 photos)
  { layout: 'collage', kicker: 'Postcards', title: 'Wish you were here', photos: [18, 19], bg: t.butter, accent: t.crimson,
    text: 'Two stops from our favorite trip. We never did find the restaurant from the map, but we found everything else. Keep these somewhere you can see them. Read the backs. I wrote on all of them.' },

  // PAGE 17 — FULL PHOTO (last one)
  { layout: 'full', photo: 20, kicker: 'Still going', title: 'To be continued', accent: t.peach },

  // PAGE 18 — STICKY NOTE
  { layout: 'note', title: 'Promises', bg: t.burgundy, paper: '#FFF1A6', accent: t.crimson,
    text: 'I promise to share the blanket, to laugh at your jokes, and to always choose the same restaurant twice.' },

  // PAGE 19 — NEXT YEAR'S LIST
  { layout: 'list', kicker: 'Looking ahead', title: "Next year's list", bg: t.cream, accent: t.crimson, items: [
    'Take the trip with the right map', 'Learn one song on guitar', 'Cook the dish we burned',
    'Watch the sunrise, properly', 'Adopt something small and fluffy', 'Write each other a letter',
    'Dance at a wedding', 'Fix the wobbly chair', 'Say yes more', 'Do this again, bigger'] },

  // PAGE 20 — BIG QUOTE (no photo)
  { layout: 'quote', quote: 'I would choose you in every issue.', by: 'Kate Studio', bg: t.oxblood, ink: t.warmWhite, accent: t.butter },

  // PAGE 21 — THANK YOU
  { layout: 'letter', kicker: 'Last page', title: 'Thank you', bg: t.blush, accent: t.crimson,
    standfirst: 'This issue was made for you, by someone who adores you.',
    body: 'Keep it. Reread it. Show it to people when you want to brag. Add a page whenever you like, because the best part of this magazine is that it is never finished. See you in the next issue.',
    signoff: 'Until next time.' },

  // PAGE 22 — CREDITS
  { layout: 'credits', kicker: 'Masthead', title: 'Made with love', bg: t.sage, accent: t.burgundy, items: [
    { role: 'Photography', name: 'The two of you' }, { role: 'Words', name: 'The heart' },
    { role: 'Styling', name: 'Whatever was clean' }, { role: 'Music', name: 'Your terrible playlists' },
    { role: 'Design and print', name: 'Kate Studio' }, { role: 'Special thanks', name: 'Coffee' } ] },

  // INSIDE BACK COVER (you see it when the last page is turned)
  { layout: 'quote', quote: 'Next issue: whenever you are ready.', by: 'Kate Studio', bg: t.butter, ink: t.nearBlack, accent: t.crimson },
]

// ---------- (nothing to edit below this line) ----------
type Style = { bg?: string; ink?: string; accent?: string }
export type PageSpec = (
  | { layout: 'cover'; photo: number; lines: string[]; badge: string }
  | { layout: 'contents'; photo: number; items: { page: number; title: string; desc: string }[] }
  | { layout: 'letter'; kicker: string; title: string; photo?: number; standfirst: string; body: string; signoff?: string }
  | { layout: 'list'; kicker: string; title: string; photo?: number; items: string[] }
  | { layout: 'full'; photo: number; kicker: string; title: string }
  | { layout: 'split'; photo: number; kicker: string; title: string; standfirst: string; text: string }
  | { layout: 'collage'; kicker: string; title: string; photos: number[]; text: string }
  | { layout: 'stats'; kicker: string; title: string; photo?: number; items: { n: string; label: string }[] }
  | { layout: 'timeline'; kicker: string; title: string; photo?: number; items: { date: string; text: string }[] }
  | { layout: 'loveletter'; title: string; body: string; signoff: string; ps?: string; photo?: number }
  | { layout: 'quote'; quote: string; by: string; photo?: number }
  | { layout: 'tracklist'; kicker: string; title: string; photo?: number; items: { title: string; note: string }[] }
  | { layout: 'qa'; kicker: string; title: string; photo?: number; items: { q: string; a: string }[] }
  | { layout: 'note'; title: string; text: string; photo?: number; paper?: string }
  | { layout: 'credits'; kicker: string; title: string; items: { role: string; name: string }[] }
) & Style
