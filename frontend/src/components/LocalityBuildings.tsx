import { useLocalityStore } from '../store/localityStore'
import { Building3D } from './Building3D'

/** Renders active 3D spatial overlay (wireframe, floor slices, 3D ULPIN badge) for selected/hovered building. */
export function LocalityBuildings() {
  const buildings = useLocalityStore((state) => state.buildings)
  const selectedBuildingId = useLocalityStore((state) => state.selectedBuildingId)
  const hoveredBuildingId = useLocalityStore((state) => state.hoveredBuildingId)

  const activeBuildings = buildings.filter(
    (b) => b.id === selectedBuildingId || (b.id === hoveredBuildingId && b.id !== selectedBuildingId),
  )

  if (activeBuildings.length === 0) return null

  return (
    <>
      {activeBuildings.map((building, index) => (
        <Building3D key={building.id} building={building} index={index} />
      ))}
    </>
  )
}

