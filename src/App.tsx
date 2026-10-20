import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Magazine, SHEET_COUNT, type FlipDrag, type Stage } from './Magazine'
import { labelTexture, noiseTexture, sealTexture, weaveTexture, woodTexture } from './paper'
import { MusicPlayer } from './Music'
import { parcel, settings, theme } from './data'

const CAMS: Record<Stage, { pos: [number, number, number]; look: [number, number, number] }> = {
  parcel: { pos: [0, 3.3, 5.4], look: [0, 0.3, 0] },
  unboxed: { pos: [0, 3.6, 4.6], look: [0, 0.3, 0] },
  lifted: { pos: [0, 2.6, 5.4], look: [0, 1.3, 0.3] },
  reading: { pos: [0, 4.9, 1.4], look: [0, 0, 0.2] },
}

function Rig({ stage, resetKey }: { stage: Stage; resetKey: number }) {
  const { camera, controls, clock } = useThree()
  const until = useRef(0)
  useEffect(() => { until.current = clock.elapsedTime + 1.5 }, [stage, resetKey, clock])
  useFrame((_, dt) => {
    if (clock.elapsedTime > until.current) return
    const c = CAMS[stage], k = 1 - Math.pow(0.002, dt)
    camera.position.lerp(new THREE.Vector3(...c.pos), k)
    const ctl = controls as unknown as { target: THREE.Vector3; update: () => void } | null
    if (ctl) { ctl.target.lerp(new THREE.Vector3(...c.look), k); ctl.update() } else camera.lookAt(...c.look)
  })
  return null
}

function Zoom({ zoom, stage }: { zoom: number; stage: Stage }) {
  const { camera, size } = useThree()
  useFrame(() => {
    // Zoom out a little on narrow screens so the parcel always fits.
    const fit = stage === 'reading' ? 1 : Math.min(1, (size.width / size.height) * 1.1)
    camera.zoom += (zoom * fit - camera.zoom) * 0.12
    camera.updateProjectionMatrix()
  })
  return null
}

const HOME = new THREE.Vector3(0, 0.5, 1.405) // front of the box, where the lid meets the base
const KRAFT = '#CDB08A', IVORY = '#EADCC8', LINING = '#E6A0B0'

function scallop(): THREE.Shape {
  const s = new THREE.Shape(), n = 96
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, r = 0.27 + 0.02 * Math.sin(a * 12) + 0.008 * Math.sin(a * 5 + 1)
    if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return s
}

/** Wax seal stuck on the ribbon strip across the front. Pull it away from the box to break it. */
function Seal({ removed, onRemoved, onDragState }: { removed: boolean; onRemoved: () => void; onDragState: (d: boolean) => void }) {
  const ref = useRef<THREE.Group>(null)
  const face = useRef<THREE.Group>(null)
  const dragging = useRef(false)
  const target = useRef(HOME.clone())
  const plane = useMemo(() => new THREE.Plane(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])
  const camera = useThree((s) => s.camera)
  const shape = useMemo(scallop, [])
  const emboss = useMemo(() => sealTexture(), [])
  const waxBump = useMemo(() => { const t = noiseTexture(); t.repeat.set(1.5, 1.5); return t }, [])
  useEffect(() => () => { emboss.dispose(); waxBump.dispose() }, [emboss, waxBump])

  useFrame((_, dt) => {
    ref.current?.position.lerp(target.current, dragging.current ? 0.5 : 1 - Math.pow(0.0005, dt))
    if (face.current) face.current.rotation.x += ((removed ? 0 : Math.PI / 2) - face.current.rotation.x) * 0.15 // lies flat once removed
  })

  const down = (e: ThreeEvent<PointerEvent>) => {
    if (removed) return
    e.stopPropagation()
    ;(e.target as unknown as Element).setPointerCapture(e.pointerId)
    camera.getWorldDirection(dir).negate()
    plane.setFromNormalAndCoplanarPoint(dir, ref.current ? ref.current.position : HOME) // drag parallel to the screen
    dragging.current = true
    onDragState(true)
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (dragging.current && e.ray.intersectPlane(plane, hit)) target.current.copy(hit)
  }
  const up = () => {
    if (!dragging.current) return
    dragging.current = false
    onDragState(false)
    const t = target.current
    if (t.distanceTo(HOME) > 0.9) { // pulled far enough: the wax breaks and it drops onto the table, clear of the box
      const z = Math.abs(t.x) < 1.5 && t.z < 1.9 ? 1.9 : t.z
      target.current.set(t.x, 0.045, z)
      onRemoved()
    } else target.current.copy(HOME)
  }

  return (
    <group ref={ref} position={HOME.toArray()} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <group ref={face} rotation={[Math.PI / 2, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} castShadow>
          <extrudeGeometry args={[shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 48 }]} />
          <meshPhysicalMaterial color="#C9A24A" bumpMap={waxBump} bumpScale={1.2} metalness={0.25} roughness={0.38} clearcoat={0.6} clearcoatRoughness={0.3} />
        </mesh>
        <mesh position={[0, 0.0425, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.19, 48]} />
          <meshPhysicalMaterial map={emboss} bumpMap={emboss} bumpScale={2} metalness={0.25} roughness={0.4} clearcoat={0.5} />
        </mesh>
      </group>
    </group>
  )
}

function Parcel({ open, sealRemoved, onRemoved, onDragState, away }: {
  open: boolean; sealRemoved: boolean; onRemoved: () => void; onDragState: (d: boolean) => void; away: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const lid = useRef<THREE.Group>(null)
  const strip = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const noise = useMemo(() => noiseTexture(), [])
  const label = useMemo(() => labelTexture(), [])
  const weave = useMemo(() => weaveTexture(), [])
  useEffect(() => () => { noise.dispose(); label.dispose(); weave.dispose() }, [noise, label, weave])

  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.01, dt)
    if (lid.current) lid.current.rotation.x += ((open ? -1.95 : 0) - lid.current.rotation.x) * k
    if (light.current) light.current.intensity += ((open ? 5 : 0) - light.current.intensity) * k
    if (strip.current) { // once the seal is broken, the front strip drops onto the table
      strip.current.position.y += ((sealRemoved ? 0.02 : 0.62) - strip.current.position.y) * k
      strip.current.rotation.x += ((sealRemoved ? -1.5 : 0) - strip.current.rotation.x) * k
    }
    // The seal lives inside this group, so it travels with the parcel and never overlaps the magazine.
    if (group.current) group.current.position.lerp(new THREE.Vector3(away ? -7 : 0, 0, away ? -2 : 0), k)
  })

  const board = { map: noise, bumpMap: noise, bumpScale: 0.4, roughness: 0.85 }
  const satin = { color: theme.burgundy, bumpMap: weave, bumpScale: 0.6, roughness: 0.35, sheen: 1, sheenRoughness: 0.3, sheenColor: theme.blush }
  return (
    <group ref={group}>
      <mesh position={[0, 0.02, 0]} receiveShadow><boxGeometry args={[2.1, 0.04, 2.6]} /><meshStandardMaterial color={LINING} roughness={0.9} /></mesh>
      {[-1.28, 1.28].map((z) => (
        <mesh key={z} position={[0, 0.25, z]} castShadow receiveShadow><boxGeometry args={[2.14, 0.5, 0.04]} /><meshStandardMaterial color={KRAFT} {...board} /></mesh>
      ))}
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.25, 0]} castShadow receiveShadow><boxGeometry args={[0.04, 0.5, 2.6]} /><meshStandardMaterial color={KRAFT} {...board} /></mesh>
      ))}
      <mesh position={[-0.62, 0.27, 1.302]}><planeGeometry args={[0.72, 0.405]} /><meshStandardMaterial map={label} roughness={0.6} /></mesh>
      <pointLight ref={light} position={[0, 0.6, 0]} color="#ff9aa8" distance={4} intensity={0} />
      <group ref={lid} position={[0, 0.5, -1.3]}>
        <mesh position={[0, 0.06, 1.32]} castShadow receiveShadow><boxGeometry args={[2.14, 0.12, 2.64]} /><meshStandardMaterial color={IVORY} {...board} /></mesh>
        <mesh position={[0, 0.128, 1.32]}><boxGeometry args={[0.22, 0.015, 2.64]} /><meshPhysicalMaterial {...satin} /></mesh>
      </group>
      <group ref={strip} position={[0, 0.62, 1.355]}>
        <mesh position={[0, -0.31, 0]} castShadow><boxGeometry args={[0.22, 0.62, 0.012]} /><meshPhysicalMaterial {...satin} /></mesh>
      </group>
      <Seal removed={sealRemoved} onRemoved={onRemoved} onDragState={onDragState} />
    </group>
  )
}

interface SceneProps {
  stage: Stage; flipped: number; sealRemoved: boolean; onRemoved: () => void; onDragState: (d: boolean) => void
  drag: React.MutableRefObject<FlipDrag | null>; zoom: number; resetKey: number; speed: number; controlsOn: boolean; showBack: boolean
}

function Scene(p: SceneProps) {
  const wood = useMemo(() => woodTexture(), [])
  useEffect(() => () => wood.dispose(), [wood])
  return (
    <>
      <color attach="background" args={[theme.nearBlack]} />
      <fog attach="fog" args={[theme.nearBlack, 10, 24]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 3]} intensity={1.9} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0004} />
      <pointLight position={[-4, 2, -3]} intensity={30} color={theme.crimson} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial map={wood} bumpMap={wood} bumpScale={0.4} roughness={0.6} />
      </mesh>
      <Parcel open={p.stage !== 'parcel'} sealRemoved={p.sealRemoved} onRemoved={p.onRemoved} onDragState={p.onDragState} away={p.stage === 'reading'} />
      <Magazine stage={p.stage} flipped={p.flipped} drag={p.drag} speed={p.speed} showBack={p.showBack} />
      <OrbitControls makeDefault enabled={p.controlsOn} enablePan={false} minDistance={2.5} maxDistance={10} maxPolarAngle={Math.PI / 2.05} />
      <Rig stage={p.stage} resetKey={p.resetKey} />
      <Zoom zoom={p.zoom} stage={p.stage} />
    </>
  )
}

interface Gesture { x: number; t: number; dir: 1 | -1; index: number; start: number }

const HINTS: Record<Stage, string> = {
  parcel: 'Pull the wax seal toward you to break it, then open the parcel.',
  unboxed: 'Lift the magazine out of the box.',
  lifted: 'Drag to turn the magazine and inspect the cover, spine and back.',
  reading: 'Drag a page to turn it, or use the arrows.',
}

export default function App() {
  const [stage, setStage] = useState<Stage>('parcel')
  const [sealRemoved, setSealRemoved] = useState(false)
  const [sealDragging, setSealDragging] = useState(false)
  const [flipped, setFlipped] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [showBack, setShowBack] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [replayKey, setReplayKey] = useState(0)
  const drag = useRef<FlipDrag | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const reduced = useMemo(() => settings.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const speed = reduced ? 40 : 6

  const next = () => setFlipped((f) => Math.min(SHEET_COUNT, f + 1))
  const prev = () => setFlipped((f) => Math.max(0, f - 1))
  const openParcel = () => { if (sealRemoved) setStage('unboxed') } // seal gate
  const replay = () => { setStage('parcel'); setSealRemoved(false); setFlipped(0); setZoom(1); setShowBack(false); setReplayKey((k) => k + 1) }

  useEffect(() => {
    if (stage !== 'reading') return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage])

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (stage !== 'reading') return
    const r = e.currentTarget.getBoundingClientRect()
    const right = e.clientX > r.left + r.width / 2
    if (right ? flipped >= SHEET_COUNT : flipped <= 0) return
    const g: Gesture = right ? { dir: 1, index: flipped, start: 0, x: e.clientX, t: performance.now() }
                             : { dir: -1, index: flipped - 1, start: 1, x: e.clientX, t: performance.now() }
    gesture.current = g
    drag.current = { index: g.index, p: g.start }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || !drag.current) return
    const w = e.currentTarget.getBoundingClientRect().width
    drag.current.p = Math.min(1, Math.max(0, g.start - (e.clientX - g.x) / (w * 0.3)))
  }
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current, d = drag.current
    gesture.current = null; drag.current = null
    if (!g || !d) return
    const dx = e.clientX - g.x, dt = Math.max(1, performance.now() - g.t), v = dx / dt
    const tap = Math.abs(dx) < 6
    const turned = tap ? g.dir === 1 : Math.abs(v) > 0.5 ? v < 0 : d.p > 0.5 // tap, flick, or past halfway
    setFlipped(turned ? g.index + 1 : g.index)
  }

  return (
    <div className="app">
      <div className="stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <Canvas key={replayKey} shadows dpr={[1, 2]} camera={{ position: CAMS.parcel.pos, fov: 40, near: 0.1, far: 60 }}>
          <Scene stage={stage} flipped={flipped} sealRemoved={sealRemoved} onRemoved={() => setSealRemoved(true)}
            onDragState={setSealDragging} drag={drag} zoom={zoom} resetKey={resetKey} speed={speed}
            controlsOn={stage !== 'reading' && !sealDragging} showBack={showBack} />
        </Canvas>
      </div>
      <header className="top"><div className="brand">
        <strong>{parcel.sender}</strong>
        <span>{stage === 'parcel' && !sealRemoved ? settings.introText : parcel.message}</span>
      </div><MusicPlayer /></header>
      <footer className="hud">
        <p>{HINTS[stage]}</p>
        <div className="row">
          {stage === 'parcel' && <button className="primary" disabled={!sealRemoved} onClick={openParcel}>Open parcel</button>}
          {stage === 'unboxed' && <button className="primary" onClick={() => setStage('lifted')}>Lift out magazine</button>}
          {stage === 'lifted' && <>
            <button className="primary" onClick={() => { setShowBack(false); setStage('reading') }}>Open magazine</button>
            <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out">−</button>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.2))} aria-label="Zoom in">+</button>
            <button onClick={() => setShowBack((b) => !b)}>{showBack ? 'Show front' : 'Show back cover'}</button>
            <button onClick={() => { setZoom(1); setShowBack(false); setResetKey((k) => k + 1) }}>Reset view</button>
            <button onClick={() => { setShowBack(false); setStage('unboxed') }}>Return to parcel</button>
          </>}
          {stage === 'reading' && <>
            <button onClick={prev} disabled={flipped === 0} aria-label="Previous page">Previous</button>
            <button onClick={next} disabled={flipped === SHEET_COUNT} aria-label="Next page">Next</button>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.2))} aria-label="Zoom in">+</button>
            <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out">−</button>
            <button className="primary" onClick={() => { setShowBack(flipped >= SHEET_COUNT); setFlipped(0); setStage('lifted') }}>{flipped >= SHEET_COUNT ? 'Close and view back' : 'Close magazine'}</button>
          </>}
          {settings.allowReplay && stage !== 'parcel' && <button onClick={replay}>Replay</button>}
        </div>
      </footer>
    </div>
  )
}
