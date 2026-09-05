import { useEffect, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

import { getBuildingFloors } from '../api/client'
import type { Building, Floor } from '../types/spatial'
import { localXYToScene, type LocalPoint } from '../utils/coordinates'
import { Unit3D } from './Unit3D'
import { useLocalityStore } from '../store/localityStore'
import { createFootprintShape, getPolygonCenter, getPolygonRing } from './footprint'

function PlannedFloorsGhost({
  building,
  anchor,
  completedHeight,
  undergroundVisible,
}: {
  building: Building
  anchor: LocalPoint
  completedHeight: number
  undergroundVisible: boolean
}) {
  const selectUnderConstruction = useLocalityStore((state) => state.selectUnderConstruction)
  const plannedFloors = building.floors_planned ?? 0
  const completedFloors = building.floors_completed ?? 0
  const shape = useMemo(() => createFootprintShape(building.footprint, anchor), [building.footprint, anchor])

  if (undergroundVisible || !shape || plannedFloors <= completedFloors) return null

  return (
    <group>
      {Array.from({ length: plannedFloors - completedFloors }, (_, index) => {
        const floorNumber = completedFloors + index + 1
        return (
          <group key={floorNumber} position={[0, completedHeight + index * 3.5, 0]}>
            {/* Ghost floor plate */}
            <mesh
              position={[0, 0.05, 0]}
              rotation-x={-Math.PI / 2}
              onClick={(event) => {
                event.stopPropagation()
                selectUnderConstruction(building.id, floorNumber)
              }}
              onPointerOver={(event) => {
                event.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto'
              }}
            >
              <shapeGeometry args={[shape]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            {/* Ghost scaffolding pillars */}
            <mesh position={[0, 1.75, 0]}>
              <boxGeometry args={[1, 3.4, 1]} />
              <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.35} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export function Building3D({ building }: { building: Building; index?: number }) {
  const [floors, setFloors] = useState<Floor[]>(() => {
    if (building.floors && building.floors.length > 0) {
      return building.floors
        .filter((f) => !f.floor_code.startsWith('F-U'))
        .map((f) => ({
          id: `${building.id}-${f.floor_code}`,
          building_id: building.id,
          floor_code: f.floor_code,
          floor_number: f.floor_number,
          is_underground: false,
          footprint: building.footprint,
          height_meters: f.height_meters || 3.5,
        }))
    }
    return []
  })

  const selectedBuildingId = useLocalityStore((state) => state.selectedBuildingId)
  const selectedFloorId = useLocalityStore((state) => state.selectedFloorId)
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  const selectBuilding = useLocalityStore((state) => state.selectBuilding)
  const selectFloor = useLocalityStore((state) => state.selectFloor)

  const isSelected = selectedBuildingId === building.id
  const hoveredBuildingId = useLocalityStore((state) => state.hoveredBuildingId)
  const isHovered = hoveredBuildingId === building.id
  const isActive = isSelected || isHovered

  const anchor = useMemo(() => getPolygonCenter(building.footprint), [building.footprint])
  const position = useMemo(() => localXYToScene(anchor), [anchor])
  const ring = useMemo(() => getPolygonRing(building.footprint), [building.footprint])

  const bldgWidth = useMemo(() => {
    const xs = ring.map(([x]) => x - anchor.x)
    return Math.max(1, Math.max(...xs) - Math.min(...xs))
  }, [ring, anchor])

  const bldgDepth = useMemo(() => {
    const zs = ring.map(([, y]) => y - anchor.y)
    return Math.max(1, Math.max(...zs) - Math.min(...zs))
  }, [ring, anchor])

  useEffect(() => {
    let active = true
    void getBuildingFloors(building.id)
      .then((data) => {
        if (active) setFloors(data.filter((floor) => !floor.is_underground))
      })
      .catch((error) => console.error(`[ULPIN 3D] Unable to load floors for ${building.id}`, error))
    return () => {
      active = false
    }
  }, [building.id])

  const orderedFloors = useMemo(
    () => [...floors].sort((left, right) => left.floor_number - right.floor_number),
    [floors],
  )

  useEffect(() => {
    if (isSelected && !selectedFloorId && orderedFloors.length > 0) {
      selectFloor(orderedFloors[0].id)
    }
  }, [isSelected, selectedFloorId, orderedFloors, selectFloor])

  const completedHeight = useMemo(() => {
    if (building.height_meters && building.height_meters > 0) {
      return building.height_meters
    }
    if (orderedFloors.length > 0) {
      return orderedFloors.reduce((h, f) => h + (f.height_meters || 3.5), 0)
    }
    return (building.stories_count || 1) * 3.5
  }, [building.height_meters, building.stories_count, orderedFloors])

  const footprintShape = useMemo(() => createFootprintShape(building.footprint, anchor), [building.footprint, anchor])

  // Parcel perimeter border points for line loop (in Three.js world Z is -Blender Y)
  const parcelLinePoints = useMemo(() => {
    return ring.map(([rx, ry]) => new THREE.Vector3(rx - anchor.x, 0.15, -(ry - anchor.y)))
  }, [ring, anchor])

  const floorData = useMemo(() => {
    return orderedFloors.map((floor, index) => {
      const elevation = orderedFloors
        .slice(0, index)
        .reduce((sum, f) => sum + (f.height_meters || 3.5), 0)
      return {
        floor,
        elevation,
        isActive: floor.id === selectedFloorId,
      }
    })
  }, [orderedFloors, selectedFloorId])

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 1. Parcel Ground Perimeter Highlight */}
      {isActive && (
        <group>
          {/* Ground Footprint Glow Plane */}
          {footprintShape && (
            <mesh position={[0, 0.12, 0]} rotation-x={-Math.PI / 2}>
              <shapeGeometry args={[footprintShape]} />
              <meshBasicMaterial
                color={isSelected ? '#f59e0b' : '#38bdf8'}
                transparent
                opacity={isSelected ? 0.35 : 0.2}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          {/* Ground Perimeter Boundary Line */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={parcelLinePoints.length}
                array={new Float32Array(parcelLinePoints.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={isSelected ? '#f59e0b' : '#38bdf8'}
              linewidth={2}
            />
          </lineLoop>
        </group>
      )}

      {/* 2. 3D Holographic Bounding Wireframe when Selected or Hovered */}
      {isActive && (
        <mesh position={[0, completedHeight / 2, 0]}>
          <boxGeometry args={[bldgWidth + 0.6, completedHeight + 0.2, bldgDepth + 0.6]} />
          <meshBasicMaterial
            color={isSelected ? '#f59e0b' : '#38bdf8'}
            wireframe
            transparent
            opacity={isSelected ? 0.55 : 0.3}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 3. Floating 3D Building ULPIN Badge */}
      {isActive && (
        <Html position={[0, completedHeight + 2.5, 0]} center distanceFactor={70} zIndexRange={[100, 0]}>
          <div
            className={`px-3 py-1.5 rounded-lg backdrop-blur-md shadow-2xl border flex items-center gap-2 pointer-events-none text-xs select-none transition-all duration-200 ${
              isSelected
                ? 'bg-amber-950/95 border-amber-400 text-amber-200 ring-2 ring-amber-400/50'
                : 'bg-slate-900/90 border-cyan-400/70 text-cyan-200'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'}`} />
            <span className="font-bold text-white tracking-wider">
              {building.house_no || building.name || building.building_code}
            </span>
            <span className="text-slate-400 text-[10px]">·</span>
            <span className="text-[11px] font-mono text-emerald-300 font-bold">{building.base_ulpin}</span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/30 px-1.5 py-0.5 rounded font-semibold ml-1">
              {building.structure_category === '1_story_house' || building.stories_count === 1
                ? '🏠 1-Story House'
                : building.structure_category === '2_story_house' || building.stories_count === 2
                ? '🏡 2-Story Duplex'
                : building.structure_category === '3_story_villa' || building.stories_count === 3
                ? '🏰 3-Story Villa'
                : `🏢 ${building.stories_count || orderedFloors.length || 1} Floors`}
            </span>
          </div>
        </Html>
      )}

      {/* 5. Floor Slices, Slabs, 3D Floor Tags & Unit Subdivisions */}
      {isSelected &&
        floorData.map(({ floor, elevation, isActive }) => (
          <group key={floor.id}>
            {/* If this floor is active, render its individual flats/units with their unique 3D ULPIN badges */}
            {isActive ? (
              <Unit3D
                floor={floor}
                anchor={anchor}
                elevation={elevation}
                onSelect={() => {
                  selectBuilding(building.id, floor.id)
                  selectFloor(floor.id)
                }}
                undergroundVisible={undergroundVisible}
              />
            ) : (
              /* Clickable floor slab slice for inactive floors */
              footprintShape && (
                <mesh
                  position={[0, elevation + 0.05, 0]}
                  rotation-x={-Math.PI / 2}
                  onClick={(event) => {
                    event.stopPropagation()
                    selectFloor(floor.id)
                  }}
                  onPointerOver={(event) => {
                    event.stopPropagation()
                    document.body.style.cursor = 'pointer'
                  }}
                  onPointerOut={() => {
                    document.body.style.cursor = 'auto'
                  }}
                >
                  <shapeGeometry args={[footprintShape]} />
                  <meshBasicMaterial
                    color="#38bdf8"
                    wireframe
                    transparent
                    opacity={0.15}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )
            )}

            {/* 3D Vertical Elevator/Floor Level Tag on Building Edge */}
            <Html
              position={[bldgWidth / 2 + 1.2, elevation + (floor.height_meters || 3.5) / 2, 0]}
              center
              distanceFactor={55}
              zIndexRange={[140, 0]}
            >
              <button
                type="button"
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all duration-150 cursor-pointer shadow-lg border select-none ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 scale-110'
                    : 'bg-slate-900/90 text-sky-200 border-sky-400/40 hover:bg-sky-600 hover:text-white'
                }`}
                onClick={(event) => {
                  event.stopPropagation()
                  selectFloor(floor.id)
                }}
                title={`Floor ${floor.floor_number} (${floor.floor_code}) - Click to inspect flats`}
              >
                {building.structure_category === '1_story_house'
                  ? 'Ground (F1)'
                  : building.structure_category === '2_story_house'
                  ? floor.floor_number === 1 ? 'Ground Story (F1)' : 'Upper Story (F2)'
                  : building.structure_category === '3_story_villa'
                  ? floor.floor_number === 1 ? 'Ground (F1)' : floor.floor_number === 2 ? 'Story 2 (F2)' : 'Penthouse (F3)'
                  : floor.floor_code}
              </button>
            </Html>
          </group>
        ))}

      {/* 6. Planned Construction Ghost Floors for half_built buildings */}
      {building.building_type === 'half_built' && (
        <PlannedFloorsGhost
          building={building}
          anchor={anchor}
          completedHeight={completedHeight}
          undergroundVisible={undergroundVisible}
        />
      )}
    </group>
  )
}
