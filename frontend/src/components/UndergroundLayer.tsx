/**
 * Underground Infrastructure Layer
 *
 * Renders Bengaluru Metro Purple-Line tunnels + station boxes and RR Nagar
 * storm-water drain network as 3D geometry in the R3F scene.
 *
 * Performance design:
 *  - Entire component tree unmounts when toggle is OFF → zero GPU cost.
 *  - useMemo builds geometry ONCE on first mount, cached for the session.
 *  - 5 drain TubeGeometries merged into 1 draw call.
 *  - 6 metro tunnel TubeGeometries merged into 1 draw call.
 *  - 3 station BoxGeometries remain separate (tiny count, direct click detection).
 *  Total extra draw calls when ON: ≤ 5.
 *  - Procedural canvas textures — no external image assets.
 *  - Click on merged meshes resolves to closest segment via point-to-segment math.
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

import { useLocalityStore } from '../store/localityStore'
import type { UndergroundInfra } from '../types/spatial'

// ─── constants ───────────────────────────────────────────────────────────────
const DRAIN_RADIAL_SEGS = 8   // balanced detail vs vertex count
const DRAIN_TUBE_SEGS   = 5   // per waypoint span
const METRO_RADIAL_SEGS = 10
const METRO_TUBE_SEGS   = 4

// ─── procedural textures ────────────────────────────────────────────────────

function createDrainTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Base dark concrete
  ctx.fillStyle = '#484848'
  ctx.fillRect(0, 0, size, size)

  // Corrugated ribs every 24 px
  for (let y = 0; y < size; y += 24) {
    const grad = ctx.createLinearGradient(0, y, 0, y + 24)
    grad.addColorStop(0,   'rgba(25,25,25,0.85)')
    grad.addColorStop(0.2, 'rgba(80,80,80,0.55)')
    grad.addColorStop(0.8, 'rgba(60,60,60,0.45)')
    grad.addColorStop(1,   'rgba(20,20,20,0.85)')
    ctx.fillStyle = grad
    ctx.fillRect(0, y, size, 24)
    ctx.fillStyle = 'rgba(110,110,110,0.65)'
    ctx.fillRect(0, y, size, 1)
  }

  // Noise pass
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 22
    img.data[i]     = Math.max(0, Math.min(255, img.data[i]     + n))
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n))
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

function createMetroTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#1e1e1e'
  ctx.fillRect(0, 0, size, size)

  // TBM segment rings every 64 px
  for (let y = 0; y < size; y += 64) {
    ctx.fillStyle = 'rgba(65,65,65,0.9)'
    ctx.fillRect(0, y, size, 3)
    ctx.fillStyle = 'rgba(88,88,88,0.6)'
    ctx.fillRect(0, y + 3, size, 1)
  }

  // Bolt column lines
  ctx.strokeStyle = 'rgba(50,50,50,0.75)'
  ctx.lineWidth = 1
  for (let x = 0; x < size; x += 32) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size)
    ctx.stroke()
  }

  // Noise
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14
    img.data[i]     = Math.max(0, Math.min(255, img.data[i]     + n))
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n))
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

// ─── geometry helpers ────────────────────────────────────────────────────────

/**
 * Build a TubeGeometry following CatmullRomCurve3 waypoints.
 * UVs are rescaled along V so 1 texture unit = textureMeters world-metres.
 */
function buildTubeGeo(
  waypoints: [number, number, number][],
  radius: number,
  radialSegs: number,
  tubeSegsPerSpan: number,
  textureMeters: number,
): THREE.BufferGeometry {
  const points = waypoints.map(([x, y, z]) => new THREE.Vector3(x, y, z))
  const curve  = new THREE.CatmullRomCurve3(points)
  const len    = curve.getLength()
  const segs   = Math.max(2, (waypoints.length - 1) * tubeSegsPerSpan)
  const geo    = new THREE.TubeGeometry(curve, segs, radius, radialSegs, false)

  // Scale UV.v so texture tiles at real-world density
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute
  const vScale = len / textureMeters
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setY(i, uvAttr.getY(i) * vScale)
  }
  uvAttr.needsUpdate = true
  return geo
}

/**
 * Lightweight manual geometry merge — avoids the three/examples import.
 * Only handles BufferGeometries with position + normal + uv + index.
 */
function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geos.length === 0) return null
  if (geos.length === 1) return geos[0]

  let totalVerts  = 0
  let totalIdxs   = 0
  for (const g of geos) {
    totalVerts += g.attributes.position.count
    if (g.index) totalIdxs += g.index.count
  }

  const pos  = new Float32Array(totalVerts * 3)
  const norm = new Float32Array(totalVerts * 3)
  const uvs  = new Float32Array(totalVerts * 2)
  const idxs = new Uint32Array(totalIdxs)

  let vOff = 0
  let iOff = 0

  for (const g of geos) {
    const pA = g.attributes.position as THREE.BufferAttribute
    const nA = g.attributes.normal   as THREE.BufferAttribute
    const uA = g.attributes.uv       as THREE.BufferAttribute
    const cnt = pA.count

    for (let i = 0; i < cnt; i++) {
      pos[( vOff + i) * 3]     = pA.getX(i)
      pos[( vOff + i) * 3 + 1] = pA.getY(i)
      pos[( vOff + i) * 3 + 2] = pA.getZ(i)
      norm[(vOff + i) * 3]     = nA.getX(i)
      norm[(vOff + i) * 3 + 1] = nA.getY(i)
      norm[(vOff + i) * 3 + 2] = nA.getZ(i)
      uvs[( vOff + i) * 2]     = uA.getX(i)
      uvs[( vOff + i) * 2 + 1] = uA.getY(i)
    }

    if (g.index) {
      for (let i = 0; i < g.index.count; i++) {
        idxs[iOff + i] = g.index.getX(i) + vOff
      }
      iOff += g.index.count
    }

    vOff += cnt
    g.dispose() // free source buffers — merged copy is canonical
  }

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(pos,  3))
  merged.setAttribute('normal',   new THREE.BufferAttribute(norm, 3))
  merged.setAttribute('uv',       new THREE.BufferAttribute(uvs,  2))
  if (totalIdxs > 0) merged.setIndex(new THREE.BufferAttribute(idxs, 1))
  return merged
}

// ─── click helpers ────────────────────────────────────────────────────────────

function distPtToSeg(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const ab = b.clone().sub(a)
  const ap = p.clone().sub(a)
  const t  = Math.max(0, Math.min(1, ap.dot(ab) / Math.max(ab.lengthSq(), 1e-9)))
  return p.distanceTo(a.clone().addScaledVector(ab, t))
}

function findClosestSeg(
  pt: THREE.Vector3,
  segs: UndergroundInfra[],
  tolerance = 20,
): UndergroundInfra | null {
  let best: UndergroundInfra | null = null
  let bestDist = Infinity

  for (const seg of segs) {
    const wps = seg.waypoints
    if (!wps || wps.length < 2) continue
    for (let i = 0; i < wps.length - 1; i++) {
      const a = new THREE.Vector3(...wps[i])
      const b = new THREE.Vector3(...wps[i + 1])
      const d = distPtToSeg(pt, a, b)
      if (d < bestDist) { bestDist = d; best = seg }
    }
  }
  return bestDist <= tolerance ? best : null
}

function getCanvas(): HTMLCanvasElement | null {
  return document.querySelector('canvas')
}

// ─── main geometry sub-component (only mounts when undergroundVisible=true) ──

function UndergroundGeometry({ segments }: { segments: UndergroundInfra[] }) {
  const selectInfra  = useLocalityStore((s) => s.selectInfra)
  const isPanning    = useLocalityStore((s) => s.isPanning)
  const { gl }       = useThree()

  // Enable renderer clipping (needed for SatelliteTerrain/ModularCityModel planes)
  useEffect(() => {
    gl.localClippingEnabled = true
    return () => { gl.localClippingEnabled = false }
  }, [gl])

  // ── partition ────────────────────────────────────────────────────────────
  const drainSegs    = useMemo(() => segments.filter((s) => s.infra_type === 'drainage'),      [segments])
  const metroTunnels = useMemo(() => segments.filter((s) => s.infra_type === 'metro_tunnel'),  [segments])
  const metroStations = useMemo(() => segments.filter((s) => s.infra_type === 'metro_station'), [segments])

  // ── textures (created once) ──────────────────────────────────────────────
  const drainTex = useMemo(createDrainTexture, [])
  const metroTex = useMemo(createMetroTexture, [])

  // ── materials ────────────────────────────────────────────────────────────
  const drainMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: drainTex,
    color: '#5a5048',
    roughness: 0.92,
    metalness: 0.08,
  }), [drainTex])

  const metroMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: metroTex,
    color: '#2a2a38',
    roughness: 0.87,
    metalness: 0.06,
  }), [metroTex])

  const stationMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3a4a5a',
    roughness: 0.72,
    metalness: 0.18,
    emissive: new THREE.Color('#102030'),
    emissiveIntensity: 0.35,
  }), [])

  // ── geometry (built once, cached by useMemo) ─────────────────────────────
  const mergedDrainGeo = useMemo(() => {
    if (drainSegs.length === 0) return null
    const geos: THREE.BufferGeometry[] = []
    for (const s of drainSegs) {
      if (!s.waypoints || s.waypoints.length < 2) continue
      geos.push(buildTubeGeo(s.waypoints, (s.diameter_m ?? 1.5) / 2, DRAIN_RADIAL_SEGS, DRAIN_TUBE_SEGS, 3))
    }
    return mergeGeos(geos)
  }, [drainSegs])

  const mergedMetroGeo = useMemo(() => {
    if (metroTunnels.length === 0) return null
    const geos: THREE.BufferGeometry[] = []
    for (const s of metroTunnels) {
      if (!s.waypoints || s.waypoints.length < 2) continue
      geos.push(buildTubeGeo(s.waypoints, (s.diameter_m ?? 6) / 2, METRO_RADIAL_SEGS, METRO_TUBE_SEGS, 8))
    }
    return mergeGeos(geos)
  }, [metroTunnels])

  // ── click handlers ───────────────────────────────────────────────────────
  const onDrainClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (isPanning) return
    e.stopPropagation()
    const closest = findClosestSeg(e.point, drainSegs)
    if (closest) selectInfra(closest)
  }, [drainSegs, selectInfra, isPanning])

  const onMetroClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (isPanning) return
    e.stopPropagation()
    const closest = findClosestSeg(e.point, metroTunnels, 8)
    if (closest) selectInfra(closest)
  }, [metroTunnels, selectInfra, isPanning])

  const cursorOn  = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const c = getCanvas(); if (c) c.style.cursor = 'pointer'
  }, [])
  const cursorOff = useCallback(() => {
    const c = getCanvas(); if (c && !useLocalityStore.getState().isPanning) c.style.cursor = ''
  }, [])

  return (
    <>
      {/* ── Merged drain network ────────────────────────────────────────── */}
      {mergedDrainGeo && (
        <mesh
          geometry={mergedDrainGeo}
          material={drainMat}
          onClick={onDrainClick}
          onPointerOver={cursorOn}
          onPointerOut={cursorOff}
        />
      )}

      {/* ── Merged metro tunnels ────────────────────────────────────────── */}
      {mergedMetroGeo && (
        <mesh
          geometry={mergedMetroGeo}
          material={metroMat}
          onClick={onMetroClick}
          onPointerOver={cursorOn}
          onPointerOut={cursorOff}
        />
      )}

      {/* ── Station boxes (individual — direct click detection) ─────────── */}
      {metroStations.map((station) => {
        const [sx, sy, sz] = station.waypoints?.[0] ?? [0, -18, 0]
        const r = (station.diameter_m ?? 6) / 2
        return (
          <group key={station.id} position={[sx, sy, sz]}>
            {/* Platform hall */}
            <mesh
              material={stationMat}
              onClick={(e) => {
                if (isPanning) return
                e.stopPropagation()
                selectInfra(station)
              }}
              onPointerOver={cursorOn}
              onPointerOut={cursorOff}
            >
              <boxGeometry args={[r * 8, r * 2.8, r * 3.5]} />
            </mesh>

            {/* Warm platform lighting */}
            <pointLight
              intensity={1.2}
              distance={120}
              decay={2}
              color="#ffd4a0"
              position={[0, r * 1.4, 0]}
            />
            <pointLight
              intensity={0.6}
              distance={80}
              decay={2}
              color="#80c8ff"
              position={[r * 3, r * 1.4, 0]}
            />
            <pointLight
              intensity={0.6}
              distance={80}
              decay={2}
              color="#80c8ff"
              position={[-r * 3, r * 1.4, 0]}
            />
          </group>
        )
      })}

      {/* ── Ambient underground lighting ────────────────────────────────── */}
      <ambientLight intensity={0.55} color="#1a2a3a" />
      <pointLight
        intensity={0.4}
        distance={600}
        decay={1.5}
        color="#4488aa"
        position={[0, -14, 0]}
      />
    </>
  )
}

// ─── public export ────────────────────────────────────────────────────────────

/**
 * Lazy underground layer — mounts geometry only when the toggle is ON.
 * Zero GPU cost while hidden (component tree fully unmounted).
 */
export function UndergroundLayer() {
  const undergroundVisible = useLocalityStore((s) => s.undergroundVisible)
  const undergroundInfra   = useLocalityStore((s) => s.undergroundInfra)

  if (!undergroundVisible || undergroundInfra.length === 0) return null

  return <UndergroundGeometry segments={undergroundInfra} />
}
