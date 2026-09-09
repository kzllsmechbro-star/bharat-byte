import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

import { getFloorUnits } from '../api/client'
import type { Floor, Unit } from '../types/spatial'
import type { LocalPoint } from '../utils/coordinates'
import { useLocalityStore } from '../store/localityStore'
import { createFootprintShape, getPolygonRing } from './footprint'

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
          color={selected ? '#0284c7' : hovered ? '#38bdf8' : UNIT_COLORS[unit.unit_type]}
          roughness={0.5}
          metalness={0.15}
          transparent={undergroundVisible || (!selected && !hovered)}
          opacity={undergroundVisible ? 0.35 : selected || hovered ? 0.95 : 0.78}
          depthWrite={!undergroundVisible}
          emissive={selected ? '#0284c7' : hovered ? '#0369a1' : '#000000'}
          emissiveIntensity={selected ? 0.35 : hovered ? 0.2 : 0}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-3}
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
            color={selected ? '#38bdf8' : hovered ? '#60a5fa' : '#ffffff'}
            linewidth={2}
            transparent
            opacity={selected || hovered ? 1 : 0.35}
          />
        </lineLoop>
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
