import { useEffect, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

import { getFloorUnits } from '../api/client'
import type { Floor, Unit } from '../types/spatial'
import type { LocalPoint } from '../utils/coordinates'
import { useLocalityStore } from '../store/localityStore'
import { createFootprintShape, getPolygonCenter, getPolygonRing } from './footprint'

const UNIT_COLORS: Record<Unit['unit_type'], string> = {
  residential: '#38bdf8',
  commercial: '#a78bfa',
  common_area: '#fb923c',
}

function UnitMesh({
  unit,
  floor,
  anchor,
  elevation,
  onSelect,
  undergroundVisible,
  selected,
}: {
  unit: Unit
  floor: Floor
  anchor: LocalPoint
  elevation: number
  onSelect: () => void
  undergroundVisible: boolean
  selected: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const shape = useMemo(() => createFootprintShape(unit.footprint, anchor), [unit.footprint, anchor])
  const ring = useMemo(() => getPolygonRing(unit.footprint), [unit.footprint])
  const unitCenter = useMemo(() => getPolygonCenter(unit.footprint), [unit.footprint])

  const depth = floor.height_meters || 3.5

  const linePoints = useMemo(() => {
    return ring.map(([rx, ry]) => new THREE.Vector3(rx - anchor.x, elevation + depth + 0.08, -(ry - anchor.y)))
  }, [ring, anchor, elevation, depth])

  if (!shape) return null

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        position={[0, elevation + 0.04, 0]}
        rotation-x={-Math.PI / 2}
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <extrudeGeometry args={[shape, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04 }]} />
        <meshStandardMaterial
          color={selected ? '#f59e0b' : hovered ? '#67e8f9' : UNIT_COLORS[unit.unit_type]}
          roughness={0.5}
          metalness={0.15}
          transparent={undergroundVisible || (!selected && !hovered)}
          opacity={undergroundVisible ? 0.35 : selected || hovered ? 0.95 : 0.78}
          depthWrite={!undergroundVisible}
          emissive={selected ? '#f59e0b' : hovered ? '#0284c7' : '#000000'}
          emissiveIntensity={selected ? 0.45 : hovered ? 0.28 : 0}
        />
      </mesh>

      {/* Crisp flat boundary outline */}
      {linePoints.length > 0 && (
        <lineLoop>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={linePoints.length}
              array={new Float32Array(linePoints.flatMap((v) => [v.x, v.y, v.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={selected ? '#fbbf24' : hovered ? '#38bdf8' : '#ffffff'}
            linewidth={2}
            transparent
            opacity={selected || hovered ? 1 : 0.4}
          />
        </lineLoop>
      )}

      {/* Floating 3D ULPIN Badge on Hover or Selection */}
      {(selected || hovered) && (
        <Html
          position={[unitCenter.x - anchor.x, elevation + depth + 1.2, -(unitCenter.y - anchor.y)]}
          center
          distanceFactor={50}
          zIndexRange={[180, 0]}
        >
          <div
            className={`px-3 py-1.5 rounded-lg backdrop-blur-md shadow-2xl border flex flex-col items-center gap-1 pointer-events-none text-xs select-none transition-all duration-200 ${
              selected
                ? 'bg-amber-950/95 border-amber-400 text-amber-200 ring-2 ring-amber-400/60 scale-105'
                : 'bg-slate-900/95 border-sky-400/80 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${selected ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'}`} />
              <span className="font-bold text-white text-xs tracking-wider">
                {unit.unit_number || `Unit ${unit.unit_code}`}
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
                {unit.unit_type}
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-300 bg-black/60 px-2 py-0.5 rounded border border-white/10 tracking-wide">
              <span>{unit.full_ulpin}</span>
              {unit.spatial_verification_hash && (
                <span className="text-amber-300 text-[10px] bg-amber-950/90 px-1 rounded border border-amber-500/50">
                  #{unit.spatial_verification_hash}
                </span>
              )}
            </div>
            {unit.elevation_meters && (
              <div className="text-[10px] text-slate-300 flex items-center gap-2">
                <span>Z: {unit.elevation_meters[0]}m – {unit.elevation_meters[1]}m</span>
                {unit.volume_m3 && <span>· Vol: {unit.volume_m3} m³</span>}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

/** Fetches and renders unit meshes for a floor. */
export function Unit3D({
  floor,
  anchor,
  elevation,
  onSelect,
  undergroundVisible,
}: {
  floor: Floor
  anchor: LocalPoint
  elevation: number
  onSelect: () => void
  undergroundVisible: boolean
}) {
  const [units, setUnits] = useState<Unit[]>([])
  const selectUnit = useLocalityStore((state) => state.selectUnit)
  const selectedUnitId = useLocalityStore((state) => state.selectedUnitId)

  useEffect(() => {
    let isActive = true
    void getFloorUnits(floor.id)
      .then((data) => {
        if (isActive) setUnits(data)
      })
      .catch((error) => console.error(`[ULPIN 3D] Unable to load units for ${floor.id}`, error))
    return () => {
      isActive = false
    }
  }, [floor.id])

  // Preserve a clickable floor-level fallback until its unit data arrives.
  const fallbackShape = useMemo(() => createFootprintShape(floor.footprint, anchor), [floor.footprint, anchor])

  if (units.length === 0) {
    if (!fallbackShape) return null
    return (
      <mesh
        castShadow
        receiveShadow
        position={[0, elevation, 0]}
        rotation-x={-Math.PI / 2}
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
      >
        <extrudeGeometry args={[fallbackShape, { depth: floor.height_meters || 3.5, bevelEnabled: false }]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.78}
          transparent={undergroundVisible}
          opacity={undergroundVisible ? 0.32 : 0.6}
          depthWrite={!undergroundVisible}
        />
      </mesh>
    )
  }

  return (
    <>
      {units.map((unit) => (
        <UnitMesh
          key={unit.id}
          unit={unit}
          floor={floor}
          anchor={anchor}
          elevation={elevation}
          undergroundVisible={undergroundVisible}
          selected={selectedUnitId === unit.id}
          onSelect={() => {
            onSelect()
            selectUnit(unit.id, floor.id)
          }}
        />
      ))}
    </>
  )
}
