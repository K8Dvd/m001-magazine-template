import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPaperBump, makeFaceTexture, type Face } from './paper'
import { theme } from './data'

export type Stage = 'parcel' | 'unboxed' | 'lifted' | 'reading'
export interface FlipDrag { index: number; p: number }

const W = 1.4, H = 1.87, SEG = 28, GAP = 0.006

const SHEETS: [Face, Face][] = Array.from({ length: 11 }, (_, i): [Face, Face] => [
  { kind: 'page', index: i * 2 },
  { kind: 'page', index: i * 2 + 1 },
])
export const SHEET_COUNT = SHEETS.length

/** One paper sheet: a subdivided plane bent every frame, so printed content follows the curl. */
function Sheet({ index, progress }: { index: number; progress: MutableRefObject<number[]> }) {
  const bend = index === 0 ? 0.3 : 1.1 // the cover is stiffer than the inner sheets
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(W, H, SEG, 1)
    g.translate(W / 2, 0, 0)
    return g
  }, [])
  const base = useMemo(() => (geo.attributes.position.array as Float32Array).slice(), [geo])
  const front = useMemo(() => makeFaceTexture(SHEETS[index][0], false), [index])
  const back = useMemo(() => makeFaceTexture(SHEETS[index][1], true), [index])
  useEffect(() => () => { front.dispose(); back.dispose(); geo.dispose() }, [front, back, geo])

  useFrame(() => {
    const p = progress.current[index]
    const phi = p * Math.PI
    const k = -bend * Math.sin(phi)
    const z0 = THREE.MathUtils.lerp((SHEET_COUNT - index) * GAP, index * GAP, p)
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const s = base[i * 3]
      let x: number, z: number
      if (Math.abs(k) < 1e-4) { x = s * Math.cos(phi); z = s * Math.sin(phi) }
      else { x = (Math.sin(phi + k * s) - Math.sin(phi)) / k; z = (Math.cos(phi) - Math.cos(phi + k * s)) / k }
      pos.setXYZ(i, x, base[i * 3 + 1], z + z0)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
  })

  return (
    <>
      <mesh geometry={geo} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial map={front} bumpMap={getPaperBump()} bumpScale={0.25} roughness={index === 0 ? 0.45 : 0.72} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geo} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial map={back} bumpMap={getPaperBump()} bumpScale={0.25} roughness={0.72} side={THREE.BackSide} />
      </mesh>
    </>
  )
}

function BackBoard() {
  const tex = useMemo(() => makeFaceTexture({ kind: 'back' }, true), [])
  const inside = useMemo(() => makeFaceTexture({ kind: 'page', index: SHEET_COUNT * 2 }, false), [])
  useEffect(() => () => { tex.dispose(); inside.dispose() }, [tex, inside])
  return (
    <group position={[0, 0, -0.02]}>
      <mesh position={[W / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={inside} roughness={0.72} />
      </mesh>
      <mesh position={[W / 2, 0, -0.001]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={tex} roughness={0.5} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

interface Props { stage: Stage; flipped: number; drag: MutableRefObject<FlipDrag | null>; speed: number; showBack: boolean }

export function Magazine({ stage, flipped, drag, speed, showBack }: Props) {
  const outer = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const progress = useRef<number[]>(Array(SHEET_COUNT).fill(0))
  const size = useThree((s) => s.size)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    const o = outer.current, n = inner.current
    if (!o || !n) return
    const aspect = size.width / size.height
    const t = stage === 'reading'
      ? { y: 0.03, z: 0.2, rx: -Math.PI / 2, s: Math.min(1.6, aspect * 1.15) }
      : stage === 'lifted' ? { y: 1.5, z: 0.6, rx: 0, s: 1 }
      : { y: 0.22, z: 0.05, rx: -Math.PI / 2, s: 1 }
    const k = 1 - Math.pow(0.02, dt * (speed > 10 ? 4 : 1))
    o.position.lerp(tmp.set(0, t.y, t.z), k)
    o.rotation.x += (t.rx - o.rotation.x) * k
    o.rotation.y += ((stage === 'lifted' && showBack ? Math.PI : 0) - o.rotation.y) * k
    o.scale.setScalar(o.scale.x + (t.s - o.scale.x) * k)
    const shift = flipped === 0 ? -W / 2 : flipped >= SHEET_COUNT ? W / 2 : 0
    n.position.x += (shift - n.position.x) * k

    const d = drag.current
    for (let i = 0; i < SHEET_COUNT; i++) {
      const target = d && d.index === i ? d.p : i < flipped ? 1 : 0
      const cur = progress.current[i]
      progress.current[i] = d && d.index === i ? target : cur + (target - cur) * Math.min(1, dt * speed)
    }
  })

  return (
    <group ref={outer} position={[0, 0.22, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
      <group ref={inner} position={[-W / 2, 0, 0]}>
        <mesh position={[-0.02, 0, 0.03]} castShadow>
          <boxGeometry args={[0.06, H, 0.1]} />
          <meshStandardMaterial color={theme.burgundy} roughness={0.6} />
        </mesh>
        <BackBoard />
        {SHEETS.map((_, i) => <Sheet key={i} index={i} progress={progress} />)}
      </group>
    </group>
  )
}
