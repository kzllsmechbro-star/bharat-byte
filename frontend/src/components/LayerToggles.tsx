import { useMemo } from 'react'
import type { BuildingType } from '../types/spatial'
import { useLocalityStore } from '../store/localityStore'

const BUILDING_TYPES: { type: BuildingType; label: string; icon: string; color: string }[] = [
  { type: 'apartment', label: 'Apartments', icon: '🏢', color: '#c4c6c9' },
  { type: 'house', label: 'Houses', icon: '🏠', color: '#b98262' },
  { type: 'half_built', label: 'Half-Built', icon: '🏗️', color: '#d6a94d' },
  { type: 'school', label: 'School', icon: '🏫', color: '#a94f43' },
]

export function LayerToggles() {
  const buildings = useLocalityStore((state) => state.buildings)
  const visibleBuildingTypes = useLocalityStore((state) => state.visibleBuildingTypes)
  const toggleBuildingType = useLocalityStore((state) => state.toggleBuildingType)
  const setAllBuildingTypesVisible = useLocalityStore((state) => state.setAllBuildingTypesVisible)
  const resetCamera = useLocalityStore((state) => state.resetCamera)

  const activeTypes = useMemo(() => new Set(buildings.map((b) => b.building_type)), [buildings])
  const availableBuildingTypes = useMemo(
    () => BUILDING_TYPES.filter(({ type }) => activeTypes.has(type)),
    [activeTypes],
  )

  const allVisible = availableBuildingTypes.every(({ type }) => visibleBuildingTypes[type] ?? true)

  return (
    <div className="layer-toggles-panel">
      <div className="panel-section-title">Layers & Filters</div>

      {/* Building Filter Buttons */}
      <div className="building-filters-list">
        <div className="filters-header">
          <span>Building Types</span>
          <button
            type="button"
            className="filters-reset-link"
            onClick={() => setAllBuildingTypesVisible(!allVisible)}
          >
            {allVisible ? 'Hide all' : 'Show all'}
          </button>
        </div>

        <div className="filter-chips">
          {availableBuildingTypes.map(({ type, label, icon, color }) => {
            const isVisible = visibleBuildingTypes[type] ?? true
            return (
              <button
                key={type}
                type="button"
                className={`filter-chip ${isVisible ? 'chip-active' : 'chip-inactive'}`}
                onClick={() => toggleBuildingType(type)}
                aria-pressed={isVisible}
              >
                <span className="chip-indicator" style={{ backgroundColor: color }} />
                <span className="chip-icon">{icon}</span>
                <span className="chip-label">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Reset Camera View */}
      <button
        type="button"
        className="reset-camera-btn"
        onClick={resetCamera}
        title="Reset 3D camera to overview"
      >
        <svg className="reset-cam-icon" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
        Reset Camera Overview
      </button>
    </div>
  )
}
