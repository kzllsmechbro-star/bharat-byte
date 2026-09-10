import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { getBuildingFloors } from '../api/client'
import type { Building, Floor } from '../types/spatial'
import { localXYToScene, type LocalPoint } from '../utils/coordinates'
import { Unit3D } from './Unit3D'
import { useLocalityStore } from '../store/localityStore'
import { createFootprintShape, getPolygonCenter, getPolygonRing } from './footprint'

/** Returns the WebGL canvas — cursor state lives on the canvas, not document.body */
const getCanvas = () => document.querySelector('canvas') as HTMLCanvasElement | null

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
                if (!useLocalityStore.getState().isPanning)
                  getCanvas()?.style && (getCanvas()!.style.cursor = 'pointer')
              }}
              onPointerOut={() => {
                if (!useLocalityStore.getState().isPanning)
                  getCanvas()?.style && (getCanvas()!.style.cursor = '')
              }}
            >
              <shapeGeometry args={[shape]} />
              <meshBasicMaterial color="#334155" transparent opacity={0.3} depthWrite={false} />
            </mesh>
            {/* Ghost scaffolding pillars */}
            <mesh position={[0, 1.75, 0]}>
              <boxGeometry args={[1, 3.4, 1]} />
              <meshBasicMaterial color="#334155" wireframe transparent opacity={0.25} />
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
  const hoveredFloorId = useLocalityStore((state) => state.hoveredFloorId)
  const setHoveredFloorId = useLocalityStore((state) => state.setHoveredFloorId)
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  const selectBuilding = useLocalityStore((state) => state.selectBuilding)
  const selectFloor = useLocalityStore((state) => state.selectFloor)

  const isSelected = selectedBuildingId === building.id

  const anchor = useMemo(() => getPolygonCenter(building.footprint), [building.footprint])
  const position = useMemo(() => localXYToScene(anchor), [anchor])
  const shape = useMemo(() => createFootprintShape(building.footprint, anchor), [building.footprint, anchor])
  const ring = useMemo(() => getPolygonRing(building.footprint), [building.footprint])

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

  const floorData = useMemo(() => {
    return orderedFloors.map((floor, index) => {
      const baseElevation = orderedFloors
        .slice(0, index)
        .reduce((sum, f) => sum + (f.height_meters || 3.5), 0)
      return {
        floor,
        elevation: baseElevation,
        depth: floor.height_meters || 3.5,
        isActive: floor.id === selectedFloorId,
        isHovered: floor.id === hoveredFloorId,
      }
    })
  }, [orderedFloors, selectedFloorId, hoveredFloorId])

  if (undergroundVisible) return null

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Interactive 3D Floor Slices when Building is Selected */}
      {isSelected &&
        shape &&
        floorData.map(({ floor, elevation, depth, isActive: isFloorActive, isHovered }) => {
          const linePoints = ring.map(
            ([rx, ry]) => new THREE.Vector3(rx - anchor.x, elevation + 0.08, -(ry - anchor.y)),
          )

          return (
            <group key={floor.id}>
              {/* Clickable 3D Floor Slab / Slice projecting in front of static city geometry */}
              <mesh
                position={[0, elevation + 0.04, 0]}
                rotation-x={-Math.PI / 2}
                scale={[1.002, 1.002, 1.0]}
                onClick={(event) => {
                  event.stopPropagation()
                  selectFloor(floor.id)
                }}
                onPointerOver={(event) => {
                  event.stopPropagation()
                  setHoveredFloorId(floor.id)
                  if (!useLocalityStore.getState().isPanning) {
                    getCanvas()?.style && (getCanvas()!.style.cursor = 'pointer')
                  }
                }}
                onPointerOut={() => {
                  setHoveredFloorId(null)
                  if (!useLocalityStore.getState().isPanning) {
                    getCanvas()?.style && (getCanvas()!.style.cursor = '')
                  }
                }}
              >
                <extrudeGeometry args={[shape, { depth: depth - 0.08, bevelEnabled: false }]} />
                <meshStandardMaterial
                  color={isFloorActive ? '#0284c7' : isHovered ? '#38bdf8' : '#0369a1'}
                  emissive={isFloorActive ? '#0284c7' : isHovered ? '#38bdf8' : '#0284c7'}
                  emissiveIntensity={isFloorActive ? 0.42 : isHovered ? 0.28 : 0.08}
                  transparent
                  opacity={isFloorActive ? 0.78 : isHovered ? 0.48 : 0.22}
                  roughness={0.35}
                  metalness={0.15}
                  polygonOffset
                  polygonOffsetFactor={-2}
                  polygonOffsetUnits={-2}
                />
              </mesh>

              {/* Perimeter glowing line boundary for each story level */}
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
                    color={isFloorActive ? '#38bdf8' : isHovered ? '#67e8f9' : '#0284c7'}
                    linewidth={2}
                    transparent
                    opacity={isFloorActive ? 1.0 : isHovered ? 0.8 : 0.35}
                  />
                </lineLoop>
              )}

              {/* Internal Flats/Units for Active Floor */}
              {isFloorActive && (
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
              )}
            </group>
          )
        })}

      {/* Planned Construction Ghost Floors for half_built buildings */}
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


