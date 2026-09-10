/* oxlint-disable react(set-state-in-effect) -- remote selection loading state is intentionally immediate. */
import { useEffect, useRef, useState } from 'react'

import { getBuildingFloors, getFloorUnits, getUnit } from '../api/client'
import { useLocalityStore } from '../store/localityStore'
import type { Floor, Unit, UnitDetail } from '../types/spatial'

function floorLabel(floorCode: string): string {
  if (floorCode.startsWith('F-U')) return `Basement ${floorCode.slice(3)}`
  const number = Number.parseInt(floorCode.slice(1), 10)
  return number === 1 ? 'Ground floor (1)' : `Floor ${number}`
}

function displayBuildingType(value: string): string {
  return value.replace('_', ' ')
}

/* ── Clean SVG Vector Icons (Strictly No Emojis) ────────────────────────── */

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="6" x2="9.01" y2="6" />
      <line x1="15" y1="6" x2="15.01" y2="6" />
      <line x1="9" y1="10" x2="9.01" y2="10" />
      <line x1="15" y1="10" x2="15.01" y2="10" />
      <line x1="9" y1="14" x2="9.01" y2="14" />
      <line x1="15" y1="14" x2="15.01" y2="14" />
      <path d="M10 22v-4h4v4" />
    </svg>
  )
}

function ParcelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function DoorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
      <path d="M2 20h20" />
      <circle cx="14" cy="12" r="1" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function PipeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
      <line x1="7" y1="7" x2="7" y2="17" />
      <line x1="17" y1="7" x2="17" y2="17" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function UlpinLoadingSkeleton() {
  return (
    <div className="skeleton-container" aria-label="Loading property details">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-box skeleton-code" />
      <div className="skeleton-line skeleton-btn" />
      <div className="skeleton-breakdown">
        <div className="skeleton-tag" />
        <div className="skeleton-tag" />
        <div className="skeleton-tag" />
        <div className="skeleton-tag" />
      </div>
      <div className="skeleton-grid">
        <div className="skeleton-fact" />
        <div className="skeleton-fact" />
        <div className="skeleton-fact" />
      </div>
    </div>
  )
}

export function UlpinInfoPanel() {
  const selectedUnitId = useLocalityStore((state) => state.selectedUnitId)
  const selectedBuildingId = useLocalityStore((state) => state.selectedBuildingId)
  const selectedFloorId = useLocalityStore((state) => state.selectedFloorId)
  const selectedInfra = useLocalityStore((state) => state.selectedInfra)
  const undergroundVisible = useLocalityStore((state) => state.undergroundVisible)
  const buildings = useLocalityStore((state) => state.buildings)
  const underConstructionMessage = useLocalityStore((state) => state.underConstructionMessage)
  const clearSelection = useLocalityStore((state) => state.clearSelection)
  const selectFloor = useLocalityStore((state) => state.selectFloor)
  const selectUnit = useLocalityStore((state) => state.selectUnit)
  const openDocumentModal = useLocalityStore((state) => state.openDocumentModal)

  const [unit, setUnit] = useState<UnitDetail | null>(null)
  const [floors, setFloors] = useState<Floor[]>([])
  const [floorUnits, setFloorUnits] = useState<Unit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoadingUnit, setIsLoadingUnit] = useState(false)
  const [isLoadingFloors, setIsLoadingFloors] = useState(false)
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const activeUnitRequestId = useRef(0)
  const copyTimerRef = useRef<number | null>(null)

  const building = buildings.find((entry) => entry.id === selectedBuildingId)

  // 1. Fetch floors when building is selected
  useEffect(() => {
    if (!selectedBuildingId) {
      setFloors([])
      return
    }

    if (building?.floors && building.floors.length > 0) {
      const immediateFloors = building.floors
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
        .sort((a, b) => a.floor_number - b.floor_number)

      setFloors(immediateFloors)
      setIsLoadingFloors(false)
      if (immediateFloors.length > 0) {
        selectFloor(immediateFloors[0].id)
      }
      return
    }

    setIsLoadingFloors(true)
    let isActive = true
    getBuildingFloors(selectedBuildingId)
      .then((data) => {
        if (isActive) {
          const sorted = [...data].sort((a, b) => a.floor_number - b.floor_number)
          setFloors(sorted)
          setIsLoadingFloors(false)
          if (sorted.length > 0) {
            selectFloor(sorted[0].id)
          }
        }
      })
      .catch((err: unknown) => {
        if (isActive) {
          console.error('[ULPIN] Failed to load building floors', err)
          setIsLoadingFloors(false)
        }
      })
    return () => {
      isActive = false
    }
  }, [selectedBuildingId, selectFloor, building])

  // 2. Fetch units when active floor changes
  useEffect(() => {
    if (!selectedFloorId) {
      setFloorUnits([])
      return
    }
    setIsLoadingUnits(true)
    let isActive = true
    getFloorUnits(selectedFloorId)
      .then((data) => {
        if (isActive) {
          setFloorUnits(data)
          setIsLoadingUnits(false)
        }
      })
      .catch((err: unknown) => {
        if (isActive) {
          console.error('[ULPIN] Failed to load floor units', err)
          setIsLoadingUnits(false)
        }
      })
    return () => {
      isActive = false
    }
  }, [selectedFloorId])

  // 3. Fetch unit details when a specific unit is selected
  useEffect(() => {
    if (!selectedUnitId) {
      setUnit(null)
      setIsLoadingUnit(false)
      return
    }

    const currentRequestId = ++activeUnitRequestId.current
    setIsLoadingUnit(true)
    setError(null)

    getUnit(selectedUnitId)
      .then((data) => {
        if (activeUnitRequestId.current === currentRequestId) {
          setUnit(data)
          setIsLoadingUnit(false)
        }
      })
      .catch((requestError: unknown) => {
        if (activeUnitRequestId.current === currentRequestId) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load flat details.')
          setIsLoadingUnit(false)
        }
      })
  }, [selectedUnitId])

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  if (undergroundVisible && !selectedInfra) {
    return null
  }

  /* When nothing is selected, do not render the panel (opens on selection like earlier) */
  if (!selectedBuildingId && !selectedUnitId && !underConstructionMessage && !selectedInfra) {
    return null
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopiedText(null), 2000)
    } catch {
      setCopiedText(null)
    }
  }

  const currentFloor = floors.find((f) => f.id === selectedFloorId)

  return (
    <aside className="ulpin-info-panel" aria-live="polite">
      {/* ── Subterranean Asset ────────────────────────────────────────────── */}
      {selectedInfra ? (
        <>
          <div className="panel-header-row">
            <span className="panel-eyebrow">Subterranean Asset</span>
            <button className="panel-close-btn" type="button" onClick={clearSelection} title="Close inspector" aria-label="Close inspector">
              <CloseIcon />
            </button>
          </div>

          <h2 className="panel-title">
            {selectedInfra.segment_name ??
              ((selectedInfra.infra_type === 'drainage' && 'Stormwater / Sewage Culvert') ||
                (selectedInfra.infra_type === 'metro_tunnel' && 'Underground Metro Tunnel') ||
                (selectedInfra.infra_type === 'metro_station' && 'Subterranean Metro Station') ||
                (selectedInfra.infra_type === 'water' && 'Potable Water Main') ||
                (selectedInfra.infra_type === 'sewer' && 'Gravity Sewer Trunk') ||
                (selectedInfra.infra_type === 'gas' && 'City Gas Pipeline') ||
                (selectedInfra.infra_type === 'power' && 'Subterranean Power Duct') ||
                'Subterranean Infrastructure')}
          </h2>

          <div className="unit-ulpin-box">
            <code className="unit-ulpin-code">
              {selectedInfra.assembled_ulpin ?? selectedInfra.full_ulpin}
            </code>
            <button
              className={`icon-copy-action-btn ${copiedText === (selectedInfra.assembled_ulpin ?? selectedInfra.full_ulpin) ? 'copied' : ''}`}
              type="button"
              onClick={() => {
                void copyText(selectedInfra.assembled_ulpin ?? selectedInfra.full_ulpin)
              }}
              title="Copy ULPIN"
            >
              {copiedText === (selectedInfra.assembled_ulpin ?? selectedInfra.full_ulpin) ? <CheckIcon /> : <CopyIcon />}
              <span>{copiedText === (selectedInfra.assembled_ulpin ?? selectedInfra.full_ulpin) ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="meta-grid">
            <div className="meta-row">
              <div className="meta-label">
                <PipeIcon />
                <span>Asset Type</span>
              </div>
              <div className="meta-value capitalize">{selectedInfra.infra_type.replace(/_/g, ' ')}</div>
            </div>

            <div className="meta-row">
              <div className="meta-label">
                <LayersIcon />
                <span>Depth</span>
              </div>
              <div className="meta-value">{selectedInfra.depth_meters} m subterranean</div>
            </div>

            {selectedInfra.diameter_m != null && (
              <div className="meta-row">
                <div className="meta-label">
                  <CubeIcon />
                  <span>Diameter</span>
                </div>
                <div className="meta-value">{selectedInfra.diameter_m} m</div>
              </div>
            )}

            {selectedInfra.material && (
              <div className="meta-row">
                <div className="meta-label">
                  <BuildingIcon />
                  <span>Material</span>
                </div>
                <div className="meta-value capitalize">{selectedInfra.material.replace(/_/g, ' ')}</div>
              </div>
            )}

            <div className="meta-row">
              <div className="meta-label">
                <ParcelIcon />
                <span>Base ULPIN</span>
              </div>
              <div className="meta-value mono-emerald">{selectedInfra.base_ulpin}</div>
            </div>
          </div>
        </>
      ) : underConstructionMessage ? (
        /* ── Under Construction Notice ───────────────────────────────────── */
        <>
          <div className="panel-header-row">
            <span className="panel-eyebrow">Under Construction</span>
            <button className="panel-close-btn" type="button" onClick={clearSelection} title="Close inspector" aria-label="Close inspector">
              <CloseIcon />
            </button>
          </div>
          <h2 className="panel-title">Structure Status</h2>
          <p className="construction-notice">{underConstructionMessage}</p>
        </>
      ) : (
        /* ── Building / Floor / Flat Inspector ───────────────────────────── */
        <>
          {building && (
            <div className="panel-building-header">
              <div className="panel-header-row">
                <span className="bldg-type-tag">
                  {displayBuildingType(building.building_type)}
                </span>
                <button className="panel-close-btn" type="button" onClick={clearSelection} title="Close inspector" aria-label="Close inspector">
                  <CloseIcon />
                </button>
              </div>

              <h2 className="panel-title">
                {building.name || `Building ${building.building_code}`}
              </h2>

              {/* Aligned Two-Column Metadata Table */}
              <div className="meta-grid">
                {building.house_no && (
                  <div className="meta-row">
                    <div className="meta-label">
                      <DoorIcon />
                      <span>House No</span>
                    </div>
                    <div className="meta-value highlight-amber">{building.house_no}</div>
                  </div>
                )}

                {building.complex_name && (
                  <div className="meta-row">
                    <div className="meta-label">
                      <BuildingIcon />
                      <span>Complex</span>
                    </div>
                    <div className="meta-value">{building.complex_name}</div>
                  </div>
                )}

                <div className="meta-row">
                  <div className="meta-label">
                    <ParcelIcon />
                    <span>Parcel ULPIN</span>
                  </div>
                  <div className="meta-value mono-emerald flex items-center justify-between">
                    <span>{building.base_ulpin}</span>
                    <button
                      type="button"
                      className="icon-copy-btn"
                      onClick={() => void copyText(building.base_ulpin)}
                      title="Copy Base ULPIN"
                    >
                      {copiedText === building.base_ulpin ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  </div>
                </div>

                <div className="meta-row">
                  <div className="meta-label">
                    <CubeIcon />
                    <span>3D ULPIN</span>
                  </div>
                  <div className="meta-value mono-cyan flex items-center justify-between">
                    <span>{building.base_ulpin}-{building.building_code}</span>
                    <button
                      type="button"
                      className="icon-copy-btn"
                      onClick={() => void copyText(`${building.base_ulpin}-${building.building_code}`)}
                      title="Copy Building 3D ULPIN"
                    >
                      {copiedText === `${building.base_ulpin}-${building.building_code}` ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  </div>
                </div>

                <div className="meta-row">
                  <div className="meta-label">
                    <LayersIcon />
                    <span>Stories</span>
                  </div>
                  <div className="meta-value">
                    {building.stories_count || floors.length || 1} Levels (
                    {building.height_meters
                      ? `${building.height_meters.toFixed(1)}m`
                      : `${((building.stories_count || floors.length || 1) * 3.5).toFixed(1)}m`}
                    )
                  </div>
                </div>

                {building.postal_address && (
                  <div className="meta-row">
                    <div className="meta-label">
                      <LocationIcon />
                      <span>Address</span>
                    </div>
                    <div className="meta-value text-slate-300 text-[11px] truncate" title={building.postal_address}>
                      {building.postal_address}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Dynamic ULPIN Document Generator Button ──────────────── */}
              <div className="bldg-document-action-wrap mt-2.5">
                <button
                  type="button"
                  className="bldg-document-trigger-btn"
                  onClick={() => openDocumentModal(building)}
                  title={`Generate and download official 3D ULPIN Cadastral Document for ${building.house_no || building.name || building.building_code}`}
                >
                  <div className="btn-left-content">
                    <FileTextIcon />
                    <span className="font-semibold text-xs">ULPIN Property Document</span>
                  </div>
                  <div className="btn-right-action">
                    <span className="btn-action-label">Generate & Download</span>
                    <DownloadIcon />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Selected Flat / Unit Hero Card ────────────────────────────── */}
          {selectedUnitId && (
            <div className="selected-flat-card">
              <div className="flex items-center justify-between mb-1.5">
                <span className="unit-card-title flex items-center gap-1.5">
                  <DoorIcon />
                  <span>{building?.building_type === 'house' ? 'House Unit' : 'Selected Flat'}</span>
                </span>
                {unit && (
                  <span className="unit-badge uppercase">
                    {unit.unit_type}
                  </span>
                )}
              </div>

              {isLoadingUnit ? (
                <UlpinLoadingSkeleton />
              ) : error ? (
                <p className="panel-error-msg">{error}</p>
              ) : unit ? (
                <>
                  <div className="unit-name-row">
                    <h3 className="unit-name">
                      {unit.unit_number || `Unit ${unit.unit_code}`}
                    </h3>
                    <span className="unit-level-tag">
                      {building?.building_type === 'house'
                        ? currentFloor?.floor_number === 1
                          ? 'Ground Level'
                          : 'Upper Level'
                        : floorLabel(unit.floor_code)}
                    </span>
                  </div>

                  <div className="unit-ulpin-box">
                    <code className="unit-ulpin-code">{unit.assembled_ulpin}</code>
                    <button
                      className={`icon-copy-action-btn ${copiedText === unit.assembled_ulpin ? 'copied' : ''}`}
                      type="button"
                      onClick={() => {
                        void copyText(unit.assembled_ulpin)
                      }}
                      title="Copy 3D ULPIN"
                    >
                      {copiedText === unit.assembled_ulpin ? <CheckIcon /> : <CopyIcon />}
                      <span>{copiedText === unit.assembled_ulpin ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Clean Hierarchy Breadcrumb */}
                  <div className="ulpin-hierarchy-row">
                    <span title="Parcel Base ULPIN">{unit.base_ulpin}</span>
                    <ArrowRightIcon />
                    <span title="Building / House">{building?.house_no || unit.building_code}</span>
                    <ArrowRightIcon />
                    <span title="Story Code">{unit.floor_code}</span>
                    <ArrowRightIcon />
                    <span className="text-cyan-300 font-bold" title="Unit Code">{unit.unit_code}</span>
                  </div>

                  {/* Clean Spatial Facts Table (No AI slop / hash) */}
                  <div className="meta-grid">
                    {unit.volume_m3 && (
                      <div className="meta-row">
                        <div className="meta-label">
                          <CubeIcon />
                          <span>Volume</span>
                        </div>
                        <div className="meta-value">{unit.volume_m3} m³</div>
                      </div>
                    )}
                    {unit.elevation_meters && (
                      <div className="meta-row">
                        <div className="meta-label">
                          <LayersIcon />
                          <span>Elevation</span>
                        </div>
                        <div className="meta-value font-mono text-emerald-300">
                          {unit.elevation_meters[0]}m – {unit.elevation_meters[1]}m
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* ── Floor Selector & 3D ULPIN Display ─────────────────────────── */}
          {isLoadingFloors ? (
            <div className="text-xs text-slate-400 py-2">Loading floors…</div>
          ) : floors.length > 0 ? (
            <div className="floor-navigator mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <LayersIcon />
                  <span>{building?.building_type === 'house' ? 'Story Level:' : 'Floor Level:'}</span>
                </span>
              </div>
              <div className="floor-pills-row">
                {floors.map((f) => {
                  const isActive = f.id === selectedFloorId
                  return (
                    <button
                      key={f.id}
                      type="button"
                      className={`floor-pill-btn ${isActive ? 'active' : ''}`}
                      onClick={() => selectFloor(f.id)}
                    >
                      {building?.building_type === 'house'
                        ? f.floor_number === 1
                          ? 'Ground (F1)'
                          : `Story ${f.floor_number} (F${f.floor_number})`
                        : f.floor_code}
                    </button>
                  )
                })}
              </div>

              {/* ── Floor 3D ULPIN Hero Card (Pops up on floor selection) ── */}
              {currentFloor && building && (() => {
                const floorIndex = floors.findIndex((f) => f.id === currentFloor.id)
                const elevStart = floors
                  .slice(0, floorIndex >= 0 ? floorIndex : 0)
                  .reduce((sum, f) => sum + (f.height_meters || 3.5), 0)
                const elevEnd = elevStart + (currentFloor.height_meters || 3.5)
                const floorUlpin = `${building.base_ulpin}-${building.building_code}-${currentFloor.floor_code}`

                return (
                  <div className="selected-floor-hero-card">
                    <div className="floor-card-top-row">
                      <div className="flex items-center gap-1.5">
                        <span className="floor-live-dot" />
                        <span className="floor-level-title">
                          {building.building_type === 'house'
                            ? currentFloor.floor_number === 1
                              ? 'Ground Story (F001)'
                              : `Upper Story (F00${currentFloor.floor_number})`
                            : `Floor Level ${currentFloor.floor_number} (${currentFloor.floor_code})`}
                        </span>
                      </div>
                      <span className="floor-elevation-chip">
                        Z: +{elevStart.toFixed(1)}m – +{elevEnd.toFixed(1)}m
                      </span>
                    </div>

                    <div className="floor-ulpin-row">
                      <div className="floor-ulpin-text">
                        <span className="floor-ulpin-tag">Floor 3D ULPIN</span>
                        <code className="floor-ulpin-val">{floorUlpin}</code>
                      </div>
                      <button
                        type="button"
                        className={`floor-copy-btn ${copiedText === floorUlpin ? 'copied' : ''}`}
                        onClick={() => void copyText(floorUlpin)}
                        title="Copy Floor 3D ULPIN"
                      >
                        {copiedText === floorUlpin ? <CheckIcon /> : <CopyIcon />}
                        <span>{copiedText === floorUlpin ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : null}

          {/* ── Flats Directory on Current Floor ──────────────────────────── */}
          <div className="floor-flats-directory mt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="flats-dir-title flex items-center gap-1.5">
                <DoorIcon />
                <span>
                  {building?.building_type === 'house'
                    ? 'Units'
                    : `Units on ${currentFloor?.floor_code || 'Floor'}`}
                </span>
                <span className="unit-count-pill">
                  {floorUnits.length}
                </span>
              </h4>
            </div>

            {isLoadingUnits ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading units…</div>
            ) : floorUnits.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-800/40 rounded border border-slate-700/50">
                No individual units recorded on this level.
              </div>
            ) : (
              <div className="flats-list">
                {floorUnits.map((u) => {
                  const isUnitSelected = selectedUnitId === u.id
                  return (
                    <div
                      key={u.id}
                      className={`flat-item-card ${isUnitSelected ? 'selected' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <DoorIcon />
                          <span className="font-bold text-xs text-white">
                            {u.unit_number || `Unit ${u.unit_code}`}
                          </span>
                        </div>
                        <span className="unit-badge">
                          {u.unit_type}
                        </span>
                      </div>

                      {/* ULPIN Row with Minimalist Icon Buttons */}
                      <div className="flex items-center justify-between gap-1.5 mt-1">
                        <code className="flat-ulpin-code">
                          {u.full_ulpin}
                        </code>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className={`icon-copy-btn ${copiedText === u.full_ulpin ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              void copyText(u.full_ulpin)
                            }}
                            title="Copy ULPIN"
                            aria-label="Copy ULPIN"
                          >
                            {copiedText === u.full_ulpin ? <CheckIcon /> : <CopyIcon />}
                          </button>

                          <button
                            type="button"
                            className={`inspect-icon-btn ${isUnitSelected ? 'active' : ''}`}
                            onClick={() => {
                              if (currentFloor) selectUnit(u.id, currentFloor.id)
                              else selectUnit(u.id)
                            }}
                            title={isUnitSelected ? 'Currently inspecting' : 'Inspect unit in 3D'}
                            aria-label="Inspect unit in 3D"
                          >
                            <ArrowRightIcon />
                          </button>
                        </div>
                      </div>

                      {u.volume_m3 && (
                        <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                          <CubeIcon />
                          <span>{u.volume_m3} m³</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
