import { useEffect, useRef, useState } from 'react'
import { settings } from './data'

interface YTPlayer { playVideo(): void; pauseVideo(): void; setVolume(v: number): void; getVideoData(): { title?: string }; destroy(): void }
interface YTNamespace { Player: new (el: HTMLElement, options: unknown) => YTPlayer }
declare global { interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void } }

/** Music only. The YouTube player is kept off-screen, so no video is ever shown and nobody is redirected. */
export function MusicPlayer() {
  const { youtubeId, src, volume: v0, autoStart, title: t0 } = settings.music
  const host = useRef<HTMLDivElement>(null)
  const yt = useRef<YTPlayer | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const isReady = useRef(Boolean(src))
  const want = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [title, setTitle] = useState(t0)
  const [vol, setVol] = useState(v0)

  useEffect(() => {
    let dead = false
    if (src) {
      const a = new Audio(src); a.loop = true; a.volume = v0; audio.current = a
      return () => { dead = true; a.pause(); audio.current = null }
    }
    const make = () => {
      if (dead || !host.current || !window.YT) return
      const el = document.createElement('div'); host.current.appendChild(el)
      yt.current = new window.YT.Player(el, {
        height: '200', width: '200', videoId: youtubeId,
        playerVars: { controls: 0, playsinline: 1, loop: 1, playlist: youtubeId, disablekb: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            isReady.current = true; e.target.setVolume(v0 * 100)
            const d = e.target.getVideoData(); if (d?.title && !t0) setTitle(d.title)
            if (want.current) e.target.playVideo()
          },
          onStateChange: (e: { data: number }) => setPlaying(e.data === 1),
        },
      })
    }
    if (window.YT?.Player) make()
    else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prev?.(); make() }
      if (!document.getElementById('yt-api')) {
        const s = document.createElement('script'); s.id = 'yt-api'; s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s)
      }
    }
    return () => { dead = true; yt.current?.destroy(); yt.current = null; isReady.current = false }
  }, [src, youtubeId, v0, t0])

  const play = () => {
    want.current = true
    if (src) { audio.current?.play().then(() => setPlaying(true)).catch(() => undefined) }
    else if (isReady.current) yt.current?.playVideo()
  }
  const pause = () => {
    want.current = false
    if (src) { audio.current?.pause(); setPlaying(false) } else yt.current?.pauseVideo()
  }

  useEffect(() => {
    if (!autoStart) return
    const go = (e: PointerEvent) => { if (!(e.target as Element).closest('.music')) play() }
    window.addEventListener('pointerdown', go, { once: true })
    return () => window.removeEventListener('pointerdown', go)
  }, [autoStart]) // eslint-disable-line react-hooks/exhaustive-deps

  const onVol = (v: number) => {
    setVol(v)
    if (src && audio.current) audio.current.volume = v
    else if (isReady.current) yt.current?.setVolume(v * 100)
  }

  return (
    <div className="music" role="group" aria-label="Music player">
      <div ref={host} className="yt-host" aria-hidden="true" />
      <button onClick={() => (playing ? pause() : play())} aria-label={playing ? 'Pause music' : 'Play music'}>{playing ? 'Pause' : 'Play'}</button>
      <span className="track">{title || 'Our song'}</span>
      <input type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => onVol(Number(e.target.value))} aria-label="Volume" />
    </div>
  )
}
