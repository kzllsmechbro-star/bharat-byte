/**
 * Subterranean Infrastructure Layer
 *
 * Renders high-fidelity road-aligned municipal drainage pipelines:
 *  - Storm Water (BBMP): Corrugated structural steel culverts tracing
 *    every single road across the entire city model.
 *
 * Utilizes centripetal Catmull-Rom curves, arc-length UV coordinates,
 * procedural PBR textures (diffuse, bump, roughness), and single-call merged geometry.
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

import { useLocalityStore } from '../store/localityStore'
import type { UndergroundInfra } from '../types/spatial'
import {
  createDrainageTextures,
  type PipelinePbrTextures,
} from '../utils/pipelineTextures'

const DRAINAGE_EMISSIVE = '#2dd4bf'
const RADIAL_SEGS = 8

// ─── geometry builder ───────────────────────────────────────────────────────

function buildSmoothTubeGeo(
  waypoints: [number, number, number][],
  radius: number,
  textureLengthMeters: number,
  circumferenceRepeats = 1,
): THREE.BufferGeometry | null {
  if (waypoints.length < 2) return null

  // Deduplicate consecutive close points to prevent zero-length curve tangents
  const cleanPts: THREE.Vector3[] = [new THREE.Vector3(...waypoints[0])]
  for (let i = 1; i < waypoints.length; i++) {
    const pt = new THREE.Vector3(...waypoints[i])
    if (pt.distanceTo(cleanPts[cleanPts.length - 1]) > 0.05) {
      cleanPts.push(pt)
    }
  }
  if (cleanPts.length < 2) return null

  const curve = new THREE.CatmullRomCurve3(cleanPts, false, 'centripetal')
  const len = curve.getLength()
  const tubeSegs = Math.max(4, Math.min(32, Math.round(len * 0.2)))
  const geo = new THREE.TubeGeometry(curve, tubeSegs, radius, RADIAL_SEGS, false)

  // Scale UVs according to physical curve length for realistic joint spacing
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute
  const cnt = uvAttr.count
  for (let i = 0; i < cnt; i++) {
    const u = uvAttr.getX(i)
    const v = uvAttr.getY(i)
    uvAttr.setXY(i, u * circumferenceRepeats, (v * len) / textureLengthMeters)
  }
  geo.computeVertexNormals()
  return geo
}

function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geos.length === 0) return null
  if (geos.length === 1) return geos[0]

  let totalVerts = 0
  let totalIdxs = 0
  for (const g of geos) {
    totalVerts += g.attributes.position.count
    if (g.index) totalIdxs += g.index.count
  }

  const pos = new Float32Array(totalVerts * 3)
  const norm = new Float32Array(totalVerts * 3)
  const uvs = new Float32Array(totalVerts * 2)
  const idxs = new Uint32Array(totalIdxs)

  let vOff = 0
  let iOff = 0

  for (const g of geos) {
    const pA = g.attributes.position as THREE.BufferAttribute
    const nA = g.attributes.normal as THREE.BufferAttribute
    const uA = g.attributes.uv as THREE.BufferAttribute
    const cnt = pA.count

    for (let i = 0; i < cnt; i++) {
      pos[(vOff + i) * 3] = pA.getX(i)
      pos[(vOff + i) * 3 + 1] = pA.getY(i)
      pos[(vOff + i) * 3 + 2] = pA.getZ(i)
      norm[(vOff + i) * 3] = nA.getX(i)
      norm[(vOff + i) * 3 + 1] = nA.getY(i)
      norm[(vOff + i) * 3 + 2] = nA.getZ(i)
      uvs[(vOff + i) * 2] = uA.getX(i)
      uvs[(vOff + i) * 2 + 1] = uA.getY(i)
    }

    if (g.index) {
      const idxAttr = g.index
      for (let i = 0; i < idxAttr.count; i++) {
        idxs[iOff + i] = idxAttr.getX(i) + vOff
      }
      iOff += idxAttr.count
    }

    vOff += cnt
  }

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(norm, 3))
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  if (totalIdxs > 0) merged.setIndex(new THREE.BufferAttribute(idxs, 1))
  return merged
}

// ─── click detection ────────────────────────────────────────────────────────

function distPtToSeg(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const ab = b.clone().sub(a)
  const ap = p.clone().sub(a)
  const t = Math.max(0, Math.min(1, ap.dot(ab) / Math.max(ab.lengthSq(), 1e-9)))
  return p.distanceTo(a.clone().addScaledVector(ab, t))
}

function findClosestSeg(
  clickPoint: THREE.Vector3,
  candidates: UndergroundInfra[],
  maxDist = 25,
): UndergroundInfra | null {
  let closest: UndergroundInfra | null = null
  let bestDist = maxDist

  for (const s of candidates) {
    if (!s.waypoints || s.waypoints.length < 2) continue
    for (let i = 0; i < s.waypoints.length - 1; i++) {
      const a = new THREE.Vector3(...s.waypoints[i])
      const b = new THREE.Vector3(...s.waypoints[i + 1])
      const d = distPtToSeg(clickPoint, a, b)
      if (d < bestDist) {
        bestDist = d
        closest = s
      }
    }
  }
  return closest
}

const getCanvas = () => document.querySelector('canvas') as HTMLCanvasElement | null

// ─── drainage network mesh ──────────────────────────────────────────────────

interface DrainageMeshProps {
  segments: UndergroundInfra[]
  pbr: PipelinePbrTextures
  onSelect: (infra: UndergroundInfra) => void
  isPanning: boolean
}

function DrainageMesh({ segments, pbr, onSelect, isPanning }: DrainageMeshProps) {
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: pbr.map,
      bumpMap: pbr.bumpMap,
      bumpScale: 0.12,
      roughnessMap: pbr.roughnessMap,
      roughness: 0.4,
      metalness: 0.3,
      emissive: new THREE.Color(DRAINAGE_EMISSIVE),
      emissiveMap: pbr.map,
      emissiveIntensity: 0.28,
    })
  }, [pbr])

  const mergedGeo = useMemo(() => {
    if (segments.length === 0) return null
    const geos: THREE.BufferGeometry[] = []
    for (const s of segments) {
      if (!s.waypoints || s.waypoints.length < 2) continue
      const radius = (s.diameter_m ?? 1.1) / 2
      const geo = buildSmoothTubeGeo(s.waypoints, radius, pbr.textureLengthMeters, pbr.circumferenceRepeats)
      if (geo) geos.push(geo)
    }
    return mergeGeometries(geos)
  }, [segments, pbr])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (isPanning) return
      e.stopPropagation()
      const closest = findClosestSeg(e.point, segments, 25)
      if (closest) onSelect(closest)
    },
    [segments, isPanning, onSelect],
  )

  const cursorOn = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const c = getCanvas()
    if (c) c.style.cursor = 'pointer'
  }, [])

  const cursorOff = useCallback(() => {
    const c = getCanvas()
    if (c && !useLocalityStore.getState().isPanning) c.style.cursor = ''
  }, [])

  if (!mergedGeo) return null

  return (
    <mesh
      geometry={mergedGeo}
      material={material}
      onClick={handleClick}
      onPointerOver={cursorOn}
      onPointerOut={cursorOff}
    />
  )
}

// ─── main underground geometry ──────────────────────────────────────────────

function UndergroundGeometry({ segments }: { segments: UndergroundInfra[] }) {
  const selectInfra = useLocalityStore((s) => s.selectInfra)
  const isPanning = useLocalityStore((s) => s.isPanning)
  const visibleInfraTypes = useLocalityStore((s) => s.visibleInfraTypes)
  const depthSlice = useLocalityStore((s) => s.depthSlice)
  const { gl } = useThree()

  useEffect(() => {
    gl.localClippingEnabled = true
    return () => {
      gl.localClippingEnabled = false
    }
  }, [gl])

  // Generate realistic PBR texture set once
  const drainPbr = useMemo(createDrainageTextures, [])

  // Filter segments by depthSlice and drainage visibility
  const drainSegs = useMemo(() => {
    if (!visibleInfraTypes.drainage) return []
    const maxDepth = Math.abs(depthSlice)
    return segments.filter(
      (s) => s.infra_type === 'drainage' && Math.abs(s.depth_meters) <= maxDepth,
    )
  }, [segments, depthSlice, visibleInfraTypes.drainage])

  return (
    <>
      {drainSegs.length > 0 && (
        <DrainageMesh
          segments={drainSegs}
          pbr={drainPbr}
          onSelect={selectInfra}
          isPanning={isPanning}
        />
      )}

      {/* Balanced, non-glare subterranean lighting */}
      <ambientLight intensity={1.25} color="#1e293b" />
      <directionalLight intensity={1.1} color="#94a3b8" position={[200, 80, 200]} />
      <pointLight intensity={0.9} distance={1500} decay={1.2} color="#2dd4bf" position={[0, -10, 0]} />

      {/* Subterranean bedrock floor at y=-24 */}
      <mesh position={[0, -24, 0]} rotation-x={-Math.PI / 2} receiveShadow={false}>
        <planeGeometry args={[12000, 12000]} />
        <meshStandardMaterial color="#080c14" roughness={0.98} metalness={0.02} />
      </mesh>
    </>
  )
}

export function UndergroundLayer() {
  const undergroundVisible = useLocalityStore((s) => s.undergroundVisible)
  const undergroundInfra = useLocalityStore((s) => s.undergroundInfra)

  if (!undergroundVisible || undergroundInfra.length === 0) return null

  return <UndergroundGeometry segments={undergroundInfra} />
}
