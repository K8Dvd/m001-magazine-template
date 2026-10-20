// ============================================================
//  KATE STUDIO MAGAZINE TEMPLATE — START HERE
//
//  1. Change the names, colours and music in THIS file.
//  2. Change what is printed on each page in  src/content.ts
//  3. Put your photos in  public/photos/  as  photo-1.jpg ... photo-20.jpg
// ============================================================

// ---------- THE PARCEL (the box that arrives) ----------
export const parcel = {
  sender: 'KATE STUDIO',
  recipient: 'Amara & Julien',          // <- name on the shipping label
  recipientSubtitle: 'Our first year',  // <- small line under the name
  message: 'Break the seal. Every page was made for you.',
  issueNumber: 'No. 001',
  date: 'October 2026',
  sealMark: 'K',                        // <- letter pressed into the wax seal
}

// ---------- THE MAGAZINE (cover and back cover) ----------
export const magazine = {
  title: 'Kate',                        // <- big title on the cover
  subtitle: 'The Love Issue',
  issueNumber: 'Issue 001',
  publisherMark: 'KATE STUDIO',
  closingTitle: 'Thank you',            // <- back cover
  closingMessage: 'Here is to the next issue, and the one after that.',
}

// ---------- MUSIC ----------
export const settings = {
  allowReplay: true,
  photoFit: 'smart' as 'smart' | 'fill', // 'smart' = never crop a photo badly (shows it whole on a blurred background). 'fill' = always crop to fill.
  respectReducedMotion: true,
  introText: 'A parcel from Kate Studio has arrived.',
  music: {
    youtubeId: 'BclvXp0t-G0', // audio only, the video is never shown
    src: '',                  // OPTIONAL: '/music/song.mp3' (file goes in public/music). More reliable than YouTube.
    title: '',                // leave empty to show the YouTube title
    volume: 0.6,
    autoStart: true,          // starts on the visitor's first tap or click
  },
}

// ---------- PHOTO CAPTIONS (one per photo, in order: photo-1 ... photo-20) ----------
const captions = [
  'The beginning', 'First light', 'Small hours', 'Borrowed jacket', 'The long way home',
  'Sunday', 'Rain on glass', 'Almost missed it', 'Two coffees', 'The detour',
  'Golden hour', 'Quiet room', 'Loud room', 'Postcard', 'Hands full',
  'Nowhere to be', 'The good chair', 'Last train', 'Candles', 'Still going',
]

// ---------- COLOURS ----------
export const theme = {
  oxblood: '#4A0712', burgundy: '#720D24', crimson: '#A30D2D', nearBlack: '#100B0D',
  charcoal: '#21191C', warmWhite: '#F4EAE8', antiqueSilver: '#B8ADB0',
  cream: '#F6EFE6', blush: '#F4C9D2', butter: '#F3D676', sky: '#A9CBE8', sage: '#B5CDA8', peach: '#F6B8A0',
}

// ---------- (nothing to edit below this line) ----------
export interface Photo { id: string; src: string; alt: string; caption: string }
export const magazinePhotos: Photo[] = captions.map((caption, i) => ({
  id: `photo-${i + 1}`, src: `/photos/photo-${i + 1}.jpg`, alt: `Photograph ${i + 1}`, caption,
}))
