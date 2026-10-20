import * as THREE from 'three'
import { magazine, magazinePhotos, parcel, settings, theme } from './data'
import { pages, type PageSpec } from './content'

export const TEX_W = 704
export const TEX_H = 939
const SCALE = 1.1 // layouts are authored on a 640 x 853 page
const W = 640, H = 853
export type Face = { kind: 'page'; index: number } | { kind: 'back' }

const SERIF = '"Bodoni MT", Didot, "Playfair Display", Georgia, serif'
const SANS = '"Helvetica Neue", Arial, sans-serif'
const HAND = '"Segoe Script", "Bradley Hand", "Brush Script MT", cursive'
const CHIPS = [theme.crimson, theme.butter, theme.sky]
const BLOCKS = [theme.crimson, theme.butter, theme.sky, theme.sage, theme.peach, theme.blush]
type Imgs = Record<number, HTMLImageElement>
type Ctx = CanvasRenderingContext2D

function fit(ctx: Ctx, text: string, max: number, size: number, weight = 700) {
  ctx.font = `${weight} ${size}px ${SERIF}`
  while (ctx.measureText(text).width > max && size > 14) { size -= 2; ctx.font = `${weight} ${size}px ${SERIF}` }
}
function lines(ctx: Ctx, text: string, max: number): string[] {
  const out: string[] = []; let line = ''
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > max && line) { out.push(line); line = w } else line = t
  }
  if (line) out.push(line)
  return out
}
function wrap(ctx: Ctx, text: string, x: number, y: number, max: number, lh: number): number {
  for (const l of lines(ctx, text, max)) { ctx.fillText(l, x, y); y += lh }
  return y
}
/** Flow text into balanced columns. */
function columns(ctx: Ctx, text: string, x: number, y: number, w: number, n: number, gap: number, lh: number, maxY: number): number {
  const cw = (w - gap * (n - 1)) / n, ls = lines(ctx, text, cw)
  const per = Math.max(1, Math.min(Math.ceil(ls.length / n), Math.floor((maxY - y) / lh)))
  ls.forEach((l, i) => { const c = Math.floor(i / per); if (c < n) ctx.fillText(l, x + c * (cw + gap), y + (i % per) * lh) })
  return y + per * lh
}
/** Big headline that wraps. Returns the y below it. */
function head(ctx: Ctx, text: string, x: number, y: number, maxW: number, size: number, lh: number, color: string): number {
  ctx.fillStyle = color; ctx.font = `700 ${size}px ${SERIF}`
  return wrap(ctx, text, x, y, maxW, lh)
}
/** Put leftover words into a box; returns the words that did not fit. */
function flow(ctx: Ctx, words: string[], x: number, y: number, w: number, lh: number, maxY: number): string[] {
  let i = 0, line = ''
  while (i < words.length && y + lh <= maxY) {
    const t = line ? `${line} ${words[i]}` : words[i]
    if (ctx.measureText(t).width > w && line) { ctx.fillText(line, x, y); y += lh; line = '' } else { line = t; i++ }
  }
  if (line && y + lh <= maxY) ctx.fillText(line, x, y)
  else if (line) i -= line.split(' ').length
  return words.slice(i)
}
/** Title on the left, a big portrait photo on the right. Returns the y below both. */
function titleBlock(ctx: Ctx, title: string, photo: number | undefined, im: (n: number) => HTMLImageElement | null, ac: string, ink: string, size: number, lh: number): number {
  if (!photo) return head(ctx, title, 44, 60, W - 88, size, lh, ink) + 10
  const pw = 210, ph = 280, px = W - 44 - pw
  framed(ctx, im(photo), photo, px, 62, pw, ph, ac)
  return Math.max(head(ctx, title, 44, 60, px - 44 - 24, size, lh, ink) + 10, 62 + ph + 22)
}
function onColor(bg: string): string {
  const n = parseInt(bg.slice(1), 16)
  return (((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000) > 150 ? theme.nearBlack : '#fff'
}
/** Draws a photo into a frame. In 'smart' mode a photo that would lose too much to cropping is shown whole, on a blurred copy of itself. */
function photoRect(ctx: Ctx, img: HTMLImageElement | null, n: number, x: number, y: number, w: number, h: number) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  if (img) {
    const loss = 1 - Math.min(img.width / img.height / (w / h), w / h / (img.width / img.height))
    if (settings.photoFit === 'smart' && loss > 0.3) {
      const r = Math.max(w / img.width, h / img.height) * 1.15
      ctx.filter = 'blur(14px)'; ctx.drawImage(img, x + (w - img.width * r) / 2, y + (h - img.height * r) / 2, img.width * r, img.height * r); ctx.filter = 'none'
      ctx.fillStyle = 'rgba(16,11,13,.25)'; ctx.fillRect(x, y, w, h)
      const c = Math.min(w / img.width, h / img.height), dw = img.width * c, dh = img.height * c
      ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 12; ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); ctx.shadowColor = 'transparent'
    } else {
      const r = Math.max(w / img.width, h / img.height)
      ctx.drawImage(img, x + (w - img.width * r) / 2, y + (h - img.height * r) / 2, img.width * r, img.height * r)
    }
  } else {
    ctx.fillStyle = '#d9d0cf'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#4a3f42'
    ctx.font = `600 ${Math.min(26, w / 7)}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`photo-${n}.jpg`, x + w / 2, y + h / 2); ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  }
  ctx.restore()
}
function framed(ctx: Ctx, img: HTMLImageElement | null, n: number, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(x - 4, y - 4, w + 8, h + 8); photoRect(ctx, img, n, x, y, w, h)
}
function polaroid(ctx: Ctx, img: HTMLImageElement | null, n: number, x: number, y: number, w: number, h: number, rot: number, tape: string) {
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot)
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5
  ctx.fillStyle = '#fbf8f3'; ctx.fillRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 54)
  ctx.shadowColor = 'transparent'
  photoRect(ctx, img, n, -w / 2, -h / 2, w, h)
  ctx.globalAlpha = 0.8; ctx.fillStyle = tape; ctx.fillRect(-35, -h / 2 - 22, 70, 24); ctx.restore()
}
function chip(ctx: Ctx, text: string, x: number, y: number, bg: string, size = 24) {
  ctx.font = `700 ${size}px ${SERIF}`
  ctx.fillStyle = bg; ctx.fillRect(x, y, ctx.measureText(text).width + 24, size + 16)
  ctx.fillStyle = onColor(bg); ctx.fillText(text, x + 12, y + 8)
}
/** Running header: section on the left, magazine name on the right, double rule. */
function header(ctx: Ctx, label: string, accent: string, ink: string) {
  ctx.font = `700 12px ${SANS}`; ctx.fillStyle = accent; ctx.fillText(label.toUpperCase(), 44, 22)
  ctx.fillStyle = ink; ctx.textAlign = 'right'; ctx.fillText(`${magazine.title.toUpperCase()}  ${magazine.issueNumber.toUpperCase()}`, W - 44, 22)
  ctx.textAlign = 'left'; ctx.fillRect(44, 40, W - 88, 3); ctx.fillRect(44, 46, W - 88, 1)
}
function foot(ctx: Ctx, n: number, ink: string) {
  ctx.globalAlpha = 0.65; ctx.fillStyle = ink; ctx.font = `700 12px ${SANS}`
  ctx.fillText(`${magazine.publisherMark}   ${magazine.issueNumber.toUpperCase()}`, 44, H - 38)
  ctx.textAlign = 'right'; ctx.fillText(String(n), W - 44, H - 38); ctx.textAlign = 'left'; ctx.globalAlpha = 1
}
function bars(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#100B0D'
  for (let i = 0, px = x + 8; px < x + w - 8; i++) { const bw = 1 + ((i * 5) % 3); ctx.fillRect(px, y + 6, bw, h - 12); px += bw + 3 }
}

export function photosOf(s: PageSpec): number[] {
  if ('photos' in s) return s.photos
  if ('photo' in s && s.photo) return [s.photo]
  return []
}

export function drawFace(ctx: Ctx, face: Face, imgs: Imgs): void {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.globalAlpha = 1
  const im = (n: number) => imgs[n] ?? null
  if (face.kind === 'back') {
    ctx.fillStyle = theme.blush; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = theme.crimson; ctx.fillRect(0, 0, W, 18)
    fit(ctx, magazine.title.toUpperCase(), W - 80, 170); ctx.fillText(magazine.title.toUpperCase(), 40, 50)
    chip(ctx, magazine.subtitle, 40, 250, theme.butter, 26)
    ctx.fillStyle = theme.nearBlack; ctx.font = `700 54px ${SERIF}`; ctx.fillText(magazine.closingTitle, 40, 340)
    ctx.font = `italic 400 30px ${SERIF}`; wrap(ctx, magazine.closingMessage, 40, 420, W - 120, 42)
    chip(ctx, parcel.date, 40, 580, theme.sky, 22)
    ctx.fillStyle = theme.nearBlack; ctx.font = `700 14px ${SANS}`; ctx.fillText(magazine.publisherMark, 40, H - 70); bars(ctx, W - 190, H - 140, 150, 100)
    return finish(ctx)
  }
  const s = pages[face.index]
  if (!s) { ctx.fillStyle = theme.cream; ctx.fillRect(0, 0, W, H); return finish(ctx) }
  const bg = s.bg ?? theme.cream, ink = s.ink ?? theme.nearBlack, ac = s.accent ?? theme.crimson
  const page = face.index + 1
  if (s.layout !== 'cover' && s.layout !== 'full' && s.layout !== 'split') { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H) }
  let footInk = ink
  switch (s.layout) {
    case 'cover': {
      photoRect(ctx, im(s.photo), s.photo, 0, 0, W, H)
      let g = ctx.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, 'rgba(16,11,13,.6)'); g.addColorStop(1, 'rgba(16,11,13,0)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 320)
      g = ctx.createLinearGradient(0, H - 420, 0, H); g.addColorStop(0, 'rgba(16,11,13,0)'); g.addColorStop(1, 'rgba(16,11,13,.85)')
      ctx.fillStyle = g; ctx.fillRect(0, H - 420, W, 420)
      ctx.textAlign = 'center'; ctx.fillStyle = theme.warmWhite
      fit(ctx, magazine.title.toUpperCase(), W - 50, 210); ctx.fillText(magazine.title.toUpperCase(), W / 2, 14)
      ctx.font = `700 13px ${SANS}`; ctx.fillText(`${magazine.subtitle.toUpperCase()}   ${parcel.date.toUpperCase()}`, W / 2, 240)
      ctx.fillStyle = theme.butter; ctx.beginPath(); ctx.arc(W - 96, 350, 62, 0, 6.283); ctx.fill()
      ctx.fillStyle = theme.nearBlack; ctx.font = `700 18px ${SERIF}`
      const bl = lines(ctx, s.badge.toUpperCase(), 96)
      bl.forEach((l, i) => ctx.fillText(l, W - 96, 350 - (bl.length * 22) / 2 + i * 22))
      ctx.textAlign = 'left'
      let y = H - 330
      s.lines.forEach((l, i) => { const size = i === 0 ? 38 : 26; chip(ctx, l, 32, y, CHIPS[i % 3], size); y += size + 26 })
      ctx.fillStyle = theme.warmWhite; ctx.font = `700 13px ${SANS}`; ctx.fillText(`${magazine.issueNumber.toUpperCase()}   ${parcel.date.toUpperCase()}`, 32, H - 52)
      bars(ctx, W - 150, H - 100, 110, 60)
      return finish(ctx)
    }
    case 'contents': {
      header(ctx, 'Contents', ac, ink); head(ctx, 'In this issue', 44, 62, W - 88, 66, 64, ink)
      framed(ctx, im(s.photo), s.photo, W - 244, 150, 200, 290, ac)
      ctx.fillStyle = ac; ctx.font = `700 96px ${SERIF}`; ctx.fillText('20', W - 244, 470)
      ctx.fillStyle = ink; ctx.font = `700 13px ${SANS}`; ctx.fillText('PHOTOGRAPHS', W - 242, 580); ctx.fillText('INSIDE', W - 242, 598)
      let y = 160
      for (const it of s.items) {
        ctx.fillStyle = ac; ctx.font = `700 34px ${SERIF}`; ctx.fillText(String(it.page).padStart(2, '0'), 44, y)
        ctx.fillStyle = ink; fit(ctx, it.title, 250, 22); ctx.fillText(it.title, 104, y + 2)
        ctx.font = `italic 400 15px ${SANS}`; ctx.globalAlpha = 0.7; ctx.fillText(it.desc, 104, y + 30); ctx.globalAlpha = 1
        y += 60
      }
      break
    }
    case 'letter': {
      header(ctx, s.kicker, ac, ink)
      const y = head(ctx, s.title, 44, 60, W - 88, 64, 62, ink) + 8
      let bodyY: number
      if (s.photo) {
        framed(ctx, im(s.photo), s.photo, 48, y + 4, 230, 306, ac)
        ctx.fillStyle = ac; ctx.font = `italic 400 27px ${SERIF}`
        const e = wrap(ctx, s.standfirst, 306, y + 4, W - 306 - 44, 34)
        ctx.fillStyle = ink; ctx.fillRect(306, e + 6, 60, 3)
        if (s.signoff) { ctx.fillStyle = ac; ctx.font = `400 36px ${HAND}`; ctx.fillText(s.signoff, 306, y + 4 + 306 - 44) }
        bodyY = y + 4 + 306 + 28
      } else {
        ctx.fillStyle = ac; ctx.font = `italic 400 27px ${SERIF}`; bodyY = wrap(ctx, s.standfirst, 44, y, W - 88, 33) + 8
        ctx.fillStyle = ink; ctx.fillRect(44, bodyY, 60, 3); bodyY += 16
      }
      ctx.fillStyle = ink; ctx.font = `400 ${s.photo ? 19 : 22}px ${SERIF}`
      const end = columns(ctx, s.body, 44, bodyY, W - 88, 2, 24, s.photo ? 26 : 31, H - 110)
      if (s.signoff && !s.photo) { ctx.fillStyle = ac; ctx.font = `400 36px ${HAND}`; ctx.fillText(s.signoff, 44, Math.min(end + 4, H - 100)) }
      break
    }
    case 'list': {
      header(ctx, s.kicker, ac, ink)
      const y = titleBlock(ctx, s.title, s.photo, im, ac, ink, 52, 50)
      const rows = Math.ceil(s.items.length / 2), colW = (W - 88) / 2, rowH = (H - 90 - y) / rows
      s.items.forEach((t, i) => {
        const cx = 44 + (i % 2) * colW, cy = y + Math.floor(i / 2) * rowH
        ctx.fillStyle = ink; ctx.fillRect(cx, cy - 6, colW - 16, 1)
        ctx.fillStyle = ac; ctx.font = `700 ${Math.min(52, rowH * 0.62)}px ${SERIF}`; ctx.fillText(String(i + 1), cx, cy)
        ctx.fillStyle = ink; ctx.font = `400 20px ${SERIF}`; wrap(ctx, t, cx + 58, cy + 2, colW - 58 - 20, 24)
      })
      break
    }
    case 'full': {
      const p = magazinePhotos[s.photo - 1]
      photoRect(ctx, im(s.photo), s.photo, 0, 0, W, H)
      const g = ctx.createLinearGradient(0, H - 430, 0, H); g.addColorStop(0, 'rgba(16,11,13,0)'); g.addColorStop(1, 'rgba(16,11,13,.9)')
      ctx.fillStyle = g; ctx.fillRect(0, H - 430, W, 430)
      chip(ctx, s.kicker, 32, 32, ac, 22)
      ctx.font = `700 74px ${SERIF}`
      const n = lines(ctx, s.title, W - 80).length, top = H - 112 - n * 70
      ctx.fillStyle = ac; ctx.fillRect(44, top - 18, 70, 6)
      head(ctx, s.title, 44, top, W - 80, 74, 70, theme.warmWhite)
      ctx.fillStyle = theme.antiqueSilver; ctx.font = `italic 400 20px ${SERIF}`; ctx.fillText(p?.caption ?? '', 44, H - 84)
      footInk = '#fff'
      break
    }
    case 'split': {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
      photoRect(ctx, im(s.photo), s.photo, 28, 28, 330, 440); chip(ctx, s.kicker, 28, 28, ac, 20)
      let y = head(ctx, s.title, 376, 36, W - 376 - 28, 46, 46, ink) + 6
      ctx.fillStyle = ac; ctx.font = `italic 400 22px ${SERIF}`; y = wrap(ctx, s.standfirst, 376, y, W - 376 - 28, 28) + 8
      ctx.fillStyle = ink; ctx.fillRect(376, y, 50, 3); y += 14
      ctx.font = `400 17px ${SERIF}`
      const rest = flow(ctx, s.text.split(' '), 376, y, W - 376 - 28, 24, 468)
      ctx.font = `400 18px ${SERIF}`; columns(ctx, rest.join(' '), 44, 492, W - 88, 2, 24, 25, H - 70)
      break
    }
    case 'collage': {
      header(ctx, s.kicker, ac, ink); const y0 = head(ctx, s.title, 44, 60, W - 88, 56, 54, ink) + 12
      ctx.font = `700 11px ${SANS}`
      if (s.photos.length === 3) {
        const [a, b, c] = s.photos, h1 = 450, hs = (h1 - 8) / 2
        photoRect(ctx, im(a), a, 28, y0, 330, h1); photoRect(ctx, im(b), b, 366, y0, 246, hs); photoRect(ctx, im(c), c, 366, y0 + hs + 8, 246, hs)
        ctx.fillStyle = ink
        ;[[a, 28], [b, 366]].forEach(([n, x]) => ctx.fillText(`${n}. ${magazinePhotos[n - 1]?.caption ?? ''}`.toUpperCase(), x, y0 + h1 + 8))
        ctx.fillStyle = ink; ctx.font = `400 18px ${SERIF}`; columns(ctx, s.text, 28, y0 + h1 + 36, W - 56, 2, 24, 25, H - 70)
      } else {
        const [a, b] = s.photos, h1 = 390
        photoRect(ctx, im(a), a, 28, y0, 286, h1); photoRect(ctx, im(b), b, 326, y0, 286, h1)
        ctx.fillStyle = ink
        ;[[a, 28], [b, 326]].forEach(([n, x]) => ctx.fillText(`${n}. ${magazinePhotos[n - 1]?.caption ?? ''}`.toUpperCase(), x, y0 + h1 + 8))
        ctx.font = `400 20px ${SERIF}`; columns(ctx, s.text, 28, y0 + h1 + 40, W - 56, 2, 24, 28, H - 70)
      }
      break
    }
    case 'stats': {
      header(ctx, s.kicker, ac, ink); const y = titleBlock(ctx, s.title, s.photo, im, ac, ink, 56, 54)
      const cw = (W - 88 - 16) / 2, ch = (H - 80 - y - 32) / 3
      s.items.slice(0, 6).forEach((it, i) => {
        const x = 44 + (i % 2) * (cw + 16), yy = y + Math.floor(i / 2) * (ch + 16), col = BLOCKS[i % 6]
        ctx.fillStyle = col; ctx.fillRect(x, yy, cw, ch); ctx.fillStyle = onColor(col)
        fit(ctx, it.n, cw - 32, Math.min(84, ch * 0.55)); ctx.fillText(it.n, x + 16, yy + 10)
        ctx.font = `700 14px ${SANS}`; wrap(ctx, it.label.toUpperCase(), x + 16, yy + ch - 40, cw - 32, 18)
      })
      break
    }
    case 'timeline': {
      header(ctx, s.kicker, ac, ink); let y = titleBlock(ctx, s.title, s.photo, im, ac, ink, 52, 50)
      ctx.fillStyle = ink; ctx.fillRect(124, y - 6, 3, H - 70 - y)
      for (const it of s.items) {
        ctx.fillStyle = ac; ctx.font = `700 14px ${SANS}`; ctx.fillText(it.date.toUpperCase(), 44, y + 2)
        ctx.beginPath(); ctx.arc(125.5, y + 9, 7, 0, 6.283); ctx.fill()
        ctx.fillStyle = ink; ctx.font = `400 21px ${SERIF}`; y = Math.max(y + 54, wrap(ctx, it.text, 146, y - 2, W - 190, 26) + 12)
      }
      break
    }
    case 'loveletter': {
      const pw = W - 72, ph = H - 150, top = 100
      ctx.save(); ctx.translate(W / 2, top + ph / 2); ctx.rotate(-0.012)
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8
      ctx.fillStyle = '#FBF6EA'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph); ctx.shadowColor = 'transparent'
      ctx.strokeStyle = 'rgba(90,130,180,.35)'; ctx.lineWidth = 1
      for (let ry = -ph / 2 + 140; ry < ph / 2 - 20; ry += 34) { ctx.beginPath(); ctx.moveTo(-pw / 2 + 20, ry); ctx.lineTo(pw / 2 - 20, ry); ctx.stroke() }
      ctx.strokeStyle = 'rgba(163,13,45,.4)'; ctx.beginPath(); ctx.moveTo(-pw / 2 + 62, -ph / 2); ctx.lineTo(-pw / 2 + 62, ph / 2); ctx.stroke()
      ctx.textBaseline = 'alphabetic'; ctx.fillStyle = ac === theme.crimson ? theme.crimson : ac
      ctx.fillStyle = theme.crimson; ctx.font = `400 42px ${HAND}`; ctx.fillText(s.title, -pw / 2 + 80, -ph / 2 + 100)
      ctx.fillStyle = '#2b2a33'; ctx.font = `400 26px ${HAND}`
      const ls = lines(ctx, s.body, pw - 80 - 30), y0 = -ph / 2 + 134
      ls.forEach((l, i) => ctx.fillText(l, -pw / 2 + 80, y0 + i * 34))
      ctx.fillStyle = theme.crimson; ctx.font = `400 34px ${HAND}`; ctx.fillText(s.signoff, -pw / 2 + 80, y0 + (ls.length + 1) * 34)
      if (s.ps) { ctx.fillStyle = '#2b2a33'; ctx.font = `400 22px ${HAND}`; ctx.fillText(s.ps, -pw / 2 + 80, y0 + (ls.length + 2) * 34 + 8) }
      ctx.restore(); ctx.textBaseline = 'top'
      if (s.photo) polaroid(ctx, im(s.photo), s.photo, W - 215, 8, 150, 150, 0.08, theme.butter)
      footInk = onColor(bg)
      break
    }
    case 'quote': {
      ctx.fillStyle = s.accent ?? ac; ctx.font = `700 260px ${SERIF}`; ctx.fillText('\u201C', 20, -50)
      ctx.font = `italic 400 ${s.photo ? 50 : 64}px ${SERIF}`; ctx.fillStyle = ink
      const y = wrap(ctx, s.quote, 48, s.photo ? 150 : 220, W - 96, s.photo ? 58 : 74)
      if (s.photo) {
        const by = Math.max(y + 24, 400), bh = H - 80 - by
        ctx.fillStyle = ac; ctx.fillRect(44, by, 262, bh)
        ctx.fillStyle = onColor(ac); ctx.font = `italic 400 28px ${SERIF}`; wrap(ctx, s.by, 64, by + bh - 70, 222, 34)
        photoRect(ctx, im(s.photo), s.photo, 322, by, 274, bh)
      } else {
        ctx.fillStyle = ac; ctx.fillRect(48, y + 14, 70, 5); ctx.font = `700 16px ${SANS}`; ctx.fillText(s.by.toUpperCase(), 48, y + 34)
      }
      break
    }
    case 'tracklist': {
      header(ctx, s.kicker, ac, ink)
      const cx = W - 160, cy = 210
      ctx.fillStyle = '#0c090a'; ctx.beginPath(); ctx.arc(cx, cy, 120, 0, 6.283); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; for (let r = 62; r < 118; r += 6) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke() }
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 64, 0, 6.283); ctx.clip()
      if (s.photo) photoRect(ctx, im(s.photo), s.photo, cx - 64, cy - 64, 128, 128); else { ctx.fillStyle = ac; ctx.fillRect(cx - 64, cy - 64, 128, 128) }
      ctx.restore(); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 6.283); ctx.fill()
      head(ctx, s.title, 44, 70, W - 330, 58, 56, ink)
      const y0 = 360, step = (H - 80 - y0) / s.items.length
      s.items.forEach((it, i) => {
        const y = y0 + i * step
        ctx.fillStyle = ink; ctx.globalAlpha = 0.25; ctx.fillRect(44, y - 6, W - 88, 1); ctx.globalAlpha = 1
        ctx.fillStyle = ac; ctx.font = `700 14px ${SANS}`; ctx.fillText(String(i + 1).padStart(2, '0'), 44, y + 4)
        ctx.fillStyle = ink; fit(ctx, it.title, W - 150, 22); ctx.fillText(it.title, 90, y)
        ctx.font = `italic 400 14px ${SANS}`; ctx.globalAlpha = 0.65; ctx.fillText(it.note, 90, y + 27); ctx.globalAlpha = 1
      })
      break
    }
    case 'qa': {
      header(ctx, s.kicker, ac, ink)
      const yT = head(ctx, s.title, 44, 60, W - 88, 56, 54, ink) + 12
      const item = (it: { q: string; a: string }, x: number, y: number, w: number): number => {
        ctx.fillStyle = ac; ctx.font = `700 13px ${SANS}`; ctx.fillText(it.q.toUpperCase(), x, y)
        ctx.fillStyle = ink; ctx.font = `italic 400 26px ${SERIF}`; return wrap(ctx, it.a, x, y + 22, w, 31) + 18
      }
      if (s.photo) {
        framed(ctx, im(s.photo), s.photo, 48, yT + 4, 230, 306, ac)
        const k = Math.ceil(s.items.length / 2); let y = yT + 4
        s.items.slice(0, k).forEach((it) => { y = item(it, 306, y, W - 306 - 44) })
        let by = Math.max(y, yT + 4 + 306 + 30)
        const rest = s.items.slice(k)
        for (let i = 0; i < rest.length; i += 2) {
          const e1 = item(rest[i], 44, by, 270), e2 = rest[i + 1] ? item(rest[i + 1], 344, by, 252) : 0
          by = Math.max(e1, e2)
        }
      } else {
        let y = yT + 10
        for (const it of s.items) y = item(it, 44, y, W - 88)
      }
      break
    }
    case 'note': {
      ctx.save(); ctx.translate(W / 2, 480); ctx.rotate(0.02)
      ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6
      ctx.fillStyle = s.paper ?? '#FFF1A6'; ctx.fillRect(-245, -330, 490, 660); ctx.shadowColor = 'transparent'
      ctx.fillStyle = ink; ctx.font = `400 46px ${HAND}`; ctx.fillText(s.title, -205, s.photo ? -150 : -290)
      ctx.font = `400 30px ${HAND}`; wrap(ctx, s.text, -205, s.photo ? -85 : -215, 410, 42)
      ctx.restore()
      if (s.photo) polaroid(ctx, im(s.photo), s.photo, 220, 90, 200, 190, 0.06, ac)
      footInk = onColor(bg)
      break
    }
    case 'credits': {
      header(ctx, s.kicker, ac, ink); let y = head(ctx, s.title, 44, 60, W - 88, 60, 58, ink) + 24
      for (const it of s.items) {
        ctx.fillStyle = ink; ctx.fillRect(44, y - 8, W - 88, 1)
        ctx.fillStyle = ac; ctx.font = `700 13px ${SANS}`; ctx.fillText(it.role.toUpperCase(), 44, y)
        ctx.fillStyle = ink; fit(ctx, it.name, W - 88, 36); ctx.fillText(it.name, 44, y + 20); y += 92
      }
      break
    }
  }
  if (page > 1) foot(ctx, page, footInk)
  finish(ctx)
}
function finish(ctx: Ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0) }

let grain: HTMLCanvasElement | null = null
/** Multiply a fine paper-fibre grain over a printed face. */
function addGrain(ctx: CanvasRenderingContext2D) {
  if (!grain) {
    grain = document.createElement('canvas'); grain.width = grain.height = 128
    const g = grain.getContext('2d')!
    for (let i = 0; i < 128 * 128; i++) { const v = 205 + Math.floor(Math.random() * 50); g.fillStyle = `rgb(${v},${v - 2},${v - 4})`; g.fillRect(i % 128, Math.floor(i / 128), 1, 1) }
    for (let i = 0; i < 260; i++) {
      g.strokeStyle = `rgba(120,110,100,${0.05 + Math.random() * 0.08})`; g.beginPath()
      const x = Math.random() * 128, y = Math.random() * 128, a = Math.random() * 6.28
      g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke()
    }
  }
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55
  ctx.fillStyle = ctx.createPattern(grain, 'repeat')!; ctx.fillRect(0, 0, TEX_W, TEX_H); ctx.restore()
}

let paperBump: THREE.CanvasTexture | null = null
export function getPaperBump(): THREE.CanvasTexture {
  if (!paperBump) { paperBump = noiseTexture(); paperBump.repeat.set(5, 6) }
  return paperBump
}

export function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512
  const x = c.getContext('2d')!
  x.fillStyle = '#3a2a26'; x.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 700; i++) {
    const y = Math.random() * 512, l = 120 + Math.random() * 380, o = Math.random() * 512
    x.strokeStyle = Math.random() > 0.5 ? `rgba(10,6,7,${Math.random() * 0.35})` : `rgba(120,86,76,${Math.random() * 0.2})`
    x.lineWidth = 0.5 + Math.random() * 1.6; x.beginPath(); x.moveTo(o, y)
    x.bezierCurveTo(o + l / 3, y + Math.random() * 5 - 2.5, o + l * 0.66, y + Math.random() * 5 - 2.5, o + l, y); x.stroke()
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.anisotropy = 8
  return t
}

export function weaveTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64
  const x = c.getContext('2d')!
  x.fillStyle = '#888'; x.fillRect(0, 0, 64, 64)
  for (let i = 0; i < 64; i += 2) { x.fillStyle = i % 4 ? '#fff' : '#333'; x.fillRect(0, i, 64, 1) }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 40)
  return t
}

/** Gold monogram pressed into the wax seal. */
export function sealTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 256
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, '#B58A33'); g.addColorStop(1, '#8E6A22')
  x.fillStyle = g; x.fillRect(0, 0, 256, 256)
  x.strokeStyle = '#F1D68A'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 112, 0, 6.283); x.stroke()
  x.lineWidth = 2; x.beginPath(); x.arc(128, 128, 98, 0, 6.283); x.stroke()
  x.fillStyle = '#F1D68A'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 130px ${SERIF}`; x.fillText(parcel.sealMark, 128, 134)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Canvas texture for one printed face. `mirror` flips U so the reverse side of a sheet reads correctly. */
export function makeFaceTexture(face: Face, mirror: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = TEX_W; c.height = TEX_H
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  if (mirror) { tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; tex.offset.x = 1 }
  const ctx = c.getContext('2d')
  if (!ctx) return tex
  const imgs: Imgs = {}
  const paint = () => { drawFace(ctx, face, imgs); addGrain(ctx); tex.needsUpdate = true }
  paint()
  if (face.kind === 'page' && pages[face.index]) {
    for (const n of photosOf(pages[face.index])) {
      const src = magazinePhotos[n - 1]?.src
      if (!src) continue
      const img = new Image()
      img.onload = () => { imgs[n] = img; paint() }
      img.src = src
    }
  }
  return tex
}

export function labelTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 640; c.height = 360
  const x = c.getContext('2d')!
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 640, 360); x.fillStyle = theme.crimson; x.fillRect(0, 0, 640, 14)
  x.fillStyle = '#100B0D'; x.textBaseline = 'top'
  x.font = `700 30px ${SERIF}`; x.fillText(parcel.sender, 28, 32)
  x.font = `400 18px ${SERIF}`; x.fillText(`${parcel.issueNumber}   ${parcel.date}`, 28, 72)
  x.fillRect(28, 102, 584, 3)
  x.fillText('Deliver to', 28, 120)
  fit(x, parcel.recipient, 584, 64); x.fillText(parcel.recipient, 28, 148)
  x.font = `italic 400 26px ${SERIF}`; x.fillText(parcel.recipientSubtitle, 28, 228)
  for (let i = 0, px = 28; px < 520; i++) { const bw = 2 + ((i * 7) % 4); x.fillRect(px, 292, bw, 52); px += bw + 3 }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

export function noiseTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const x = c.getContext('2d')!
  for (let i = 0; i < 128 * 128; i++) { const v = 190 + Math.floor(Math.random() * 65); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(i % 128, Math.floor(i / 128), 1, 1) }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3)
  return t
}
